import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { createEditor, Transforms, Editor, Text, Range, Node } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import classNames from 'classnames';
import { connect } from 'react-redux';
import fuzzysort from 'fuzzysort';
import { getRecords, getTables, tablesSetActiveRecord } from 'reducers/tables';
import { getPages, pagesSetActivePage, getActivePageId, getPagePathUtil } from 'reducers/pages';
import { rollAction } from 'reducers/rolls';
import { get } from 'lodash';

import './Editor.scss';

const electron = window.require('electron');

const DICE_REGEX = /^(^|\s|\()+(?<dice>(\d+)?[dD](\d+)(\s)?([+-](\s)?\d+)?)(\))?$/;
const IMG_URL_REGEX = /\.(jpeg|jpg|gif|png)(\?|$)/;
const URL_REGEX = new RegExp(
  "^" +
    // protocol identifier (optional)
    // short syntax // still required
    "(?:(?:(?:https?|ftp):)?\\/\\/)" +
    // user:pass BasicAuth (optional)
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broadcast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host & domain names, may end with dot
      // can be replaced by a shortest alternative
      // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
      "(?:" +
        "(?:" +
          "[a-z0-9\\u00a1-\\uffff]" +
          "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
        ")?" +
        "[a-z0-9\\u00a1-\\uffff]\\." +
      ")+" +
      // TLD identifier name, may end with dot
      "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
    ")" +
    // port number (optional)
    "(?::\\d{2,5})?" +
    // resource path (optional)
    "(?:[/?#]\\S*)?" +
  "$", "i"
);


const INLINE_MATCHES = [
  // Record
  {
    element: 'record',
    dataProp: 'record',
    regex: /^@([a-zA-Z0-9]+)$/,
    searchKey: 'name',
    getData: ({ records }) => {
      return Object.values(records).map(r => {
        let name;
        if (typeof r.name === 'object') {
          name = r.name.map(n => Node.string(n))[0];
        } else {
          name = r.name;
        }

        return {
          ...r,
          name,
        }
      });
    },
    stateKey: 'recordMatches',
  },
  {
    element: 'page',
    dataProp: 'page',
    regex: /^#([a-zA-Z0-9]+)$/,
    searchKey: 'name',
    getData: ({ pages }) => Object.entries(pages).map(([key, page]) => ({ name: page.name, key})),
    stateKey: 'pageMatches',
  }
]

const LIST_TYPES = ['list', 'ordered-list'];

const withInline = editor => {
  const { isInline, isVoid } = editor
  const inlines = INLINE_MATCHES.map(c => c.element);
  inlines.push('roller');
  inlines.push('link');
  inlines.push('image')

  const voids = INLINE_MATCHES.map(c => c.element);
  voids.push('image');
  voids.push('roller');

  editor.isInline = element => {
    return inlines.includes(element.type) ? true : isInline(element)
  }

  editor.isVoid = element => {
    return voids.includes(element.type) ? true : isVoid(element)
  }

  return editor
}

const CustomEditorEvents = {
  isFormatMarkActive(editor, format) {
    const [match] = Editor.nodes(editor, {
      match: n => n[format] === true,
      universal: true,
    })

    return !!match
  },

  toggleFormatMark(editor, format) {
    const isActive = CustomEditorEvents.isFormatMarkActive(editor, format)
    Transforms.setNodes(
      editor,
      { [format]: isActive ? null : true },
      {
        match: n => Text.isText(n),
        hanging: true,
        split: true,
      }
    )
  },

  isBlockActive(editor, blockType) {
    const [match] = Editor.nodes(editor, {
      match: n => n.type === blockType,
    })

    return !!match
  },

  toggleBlock(editor, blockType) {
    const isActive = CustomEditorEvents.isBlockActive(editor, blockType);
    const isList = LIST_TYPES.includes(blockType);

    if (isList) {
      Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type),
        split: true,
      });

      Transforms.setNodes(editor, {
        type: isActive ? null : 'list-item',
      });

      if (!isActive) {
        const block = { type: blockType, children: [] }
        Transforms.wrapNodes(editor, block)
      }
    } else {
      Transforms.setNodes(
        editor,
        { type: isActive ? null : blockType },
        { match: n => Editor.isBlock(editor, n) }
      )
    }
  },
}

export const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}

const Leaf = props => {
  return (
    <span
      {...props.attributes}
      className={classNames('leaf', {
        bold: props.leaf.bold,
        italic: props.leaf.italic,
      })}
    >
      {props.children}
    </span>
  )
}

const Element = connect(() => ({}), { setPage: pagesSetActivePage, rollDice: rollAction, setActiveRecord: tablesSetActiveRecord })(({
  attributes,
  children,
  element,
  setPage,
  rollDice,
  setActiveRecord,
}) => {
  switch (element.type) {
    case 'h1':
      return <h1 {...attributes}>{children}</h1>
    case 'h2':
      return <h2 {...attributes}>{children}</h2>
    case 'h3':
      return <h3 {...attributes}>{children}</h3>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'ordered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list':
      return <ul {...attributes}>{children}</ul>
    case 'callout':
      return <div className="callout" {...attributes}>{children}</div>
    case 'quote':
      return <div className="quote" {...attributes}>{children}</div>
    case 'record':
      return (
        <span className="record" contentEditable={false} {...attributes} onClick={() => setActiveRecord(element.record.__id)}>
          {element.record.name}
          {children}
        </span>
      );
    case 'page':
      return (
        <span className="page-link" contentEditable={false} {...attributes} onClick={() => setPage(element.page.key)}>
          {element.page.name}
          {children}
        </span>
      );
    case 'roller':
      return (
        <span className="dice" {...attributes} onClick={() => rollDice(element.dice)}>
          {element.dice}
          {children}
        </span>
      )
    case 'link':
      return (
        <a {...attributes} onClick={() => electron.shell.openExternal(element.children[0].text)}>
          {children}
        </a>
      )
    case 'image':
      return (
        <span>
          <img {...attributes} src={element.src} alt="" onClick={() => electron.shell.openExternal(element.src)}/>
          {children}
        </span>
      )
    default:
      return <p {...attributes}>{children}</p>
  }
});

class CustomEditor extends Component {
  static defaultProps = {
    onBlur: () => {},
    onChange: () => {},
    onDelete: () => {},
    onFocus: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      editor: withInline(withReact(createEditor())),
      pageMatches: [],
      recordMatches: [],
      targetRange: null,
      portalRef: React.createRef(),
      selectIndex: 0,
    };
  }

  renderElement = (props) => {
    return <Element {...props} />
  }

  renderLeaf = (props) => {
    return <Leaf {...props} />
  }

  onChange = (newValue) => {
    const { editor } = this.state;

    if (newValue !== this.props.value) {
      this.props.onChange(newValue);
    }

    if (editor.selection) {
      const [start] = Range.edges(editor.selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);

      for (let i = 0; i < INLINE_MATCHES.length; i++) {
        const { stateKey, regex, searchKey, getData } = INLINE_MATCHES[i];

        const match = (beforeText || '').match(regex);

        if (match) {
          const results = fuzzysort.go(match[1], getData(this.props), { key: searchKey });
          this.setState({
            [stateKey]: results.map(r => r.obj),
            targetRange: beforeRange,
          });
        } else {
          this.setState({ [stateKey]: [] });
        }
      }
    }
    this.setState({ selectIndex: 0 });
  }

  onKeyDown = (event) => {
    const { onNext, onDelete } = this.props;
    const { editor, targetRange, selectIndex, pageMatches, recordMatches } = this.state;

    if (event.key === 'ArrowDown' && (pageMatches.length || recordMatches.length)) {
      event.preventDefault();
      const length = pageMatches.length || recordMatches.length;
      this.setState({
        selectIndex: Math.min(selectIndex+1, length - 1),
      });
    }

    if (event.key === 'ArrowUp' && (pageMatches.length || recordMatches.length)) {
      event.preventDefault();
      this.setState({
        selectIndex: Math.max(selectIndex-1, 0),
      });
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      onNext(event);
      return;
    }

    if (event.key === 'Enter') {
      for (let i = 0; i < INLINE_MATCHES.length; i++) {
        const { stateKey, element, dataProp } = INLINE_MATCHES[i];

        const results = this.state[stateKey];

        if (results.length) {
          event.preventDefault();
          Transforms.select(editor, targetRange);

          const inlineEl = {
            type: element,
            [dataProp]: results[selectIndex],
            children: [{ text: '' }],
          };

          Transforms.insertNodes(editor, inlineEl);
          Transforms.move(editor, { distance: 1 });
        }
      }
    }

    if (event.key === 'Backspace') {
      const [currentCursor] = Range.edges(editor.selection);
      const wordStart = Editor.before(editor, currentCursor, { unit: 'block' });
      const prevWordRange = wordStart && Editor.range(editor, wordStart, currentCursor);
      const prevWord = prevWordRange && Editor.string(editor, prevWordRange);

      if (prevWord === undefined && CustomEditorEvents.isBlockActive(editor, 'list')) {
        CustomEditorEvents.toggleBlock(editor, 'list')
      } else if (prevWord === undefined && CustomEditorEvents.isBlockActive(editor, 'ordered-list')) {
        CustomEditorEvents.toggleBlock(editor, 'ordered-list')
      } else if (prevWord === undefined) {
        CustomEditorEvents.toggleBlock(editor, null)
      }

      if (Node.string(editor).length === 0 && editor.children.length === 1) {
        onDelete();
      }
    }

    if (event.key === ' ' && editor.selection) {
      const [currentCursor] = Range.edges(editor.selection);
      const lineStart = Editor.before(editor, currentCursor, { unit: 'line' });
      const prevLineRange = lineStart && Editor.range(editor, lineStart, currentCursor);
      const prevLine = prevLineRange && Editor.string(editor, prevLineRange);
      const [prevWord] = (prevLine || '').split(' ').slice(-1) || '';
      Transforms.select(editor, prevLineRange);
      Transforms.move(editor, {
        distance: prevLine.length - prevWord.length,
        unit: 'character',
        edge: 'anchor',
      });

      if (prevWord.match(URL_REGEX)) {
        // Check if prev word is a parseable url
        const isImgUrl = prevWord.match(IMG_URL_REGEX);

        let el;
        if (isImgUrl) {
          el = {
            type: 'image',
            src: prevWord,
            children: [{ text: '' }],
          }
        } else {
          el = {
            type: 'link',
            children: [{ text: prevWord }]
          }
        }

        Transforms.insertNodes(editor, el);
      }

      const match = (prevWord || '').match(DICE_REGEX)

      if (match) {
        const roller = {
          type: 'roller',
          dice: match[2],
          children: [{ text: '' }]
        }

        if (prevWord.startsWith('(')) {
          Transforms.insertText(editor, '(');
        }

        Transforms.insertNodes(editor, roller);
        Transforms.move(editor, { distance: 1 });

        if (prevWord.endsWith(')')) {
          Transforms.insertText(editor, ')');
        }
      }

      if (prevWord === '1.') {
        event.preventDefault()
        Transforms.insertText(editor, '');
        CustomEditorEvents.toggleBlock(editor, 'ordered-list');
      }

      if (prevWord === '*' || prevWord === '-') {
        event.preventDefault()
        Transforms.insertText(editor, '');
        CustomEditorEvents.toggleBlock(editor, 'list');
      }

      Transforms.collapse(editor, { edge: 'end' });
    }

    if (!event.metaKey) {
      return;
    }

    switch (event.key) {
      case '1': {
        event.preventDefault();
        CustomEditorEvents.toggleBlock(editor, 'h1');
        break;
      }

      case '2': {
        event.preventDefault();
        CustomEditorEvents.toggleBlock(editor, 'h2');
        break;
      }

      case '3': {
        event.preventDefault();
        CustomEditorEvents.toggleBlock(editor, 'h3');
        break;
      }

      case 'p': {
        event.preventDefault()
        CustomEditorEvents.toggleBlock(editor, 'callout');
        break
      }

      case 'q': {
        event.preventDefault()
        CustomEditorEvents.toggleBlock(editor, 'quote');
        break
      }

      case 'b': {
        event.preventDefault();
        CustomEditorEvents.toggleFormatMark(editor, 'bold');
        break
      }

      case 'i': {
        event.preventDefault();
        CustomEditorEvents.toggleFormatMark(editor, 'italic');
        break
      }

      default:
        break;
    }
  }

  handleBlur = () => {
    if (ReactEditor.isFocused(this.state.editor)) {
      this.props.onBlur();
      this.setState({
        recordMatches: [],
        pageMatches: [],
      })
    }
  }

  handleFocus = () => {
    const { focus } = this.props;
    const { editor } = this.state;

    if (focus && !ReactEditor.isFocused(editor)) {
      ReactEditor.focus(editor);
    }
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleBlur);
    this.handleFocus();
  }

  componentWillUnmount() {
    this.handleBlur();
    window.removeEventListener('beforeunload', this.handleBlur);
  }

  componentDidUpdate() {
    this.handleFocus();

    const { editor, recordMatches, pageMatches, targetRange, portalRef } = this.state;

    if ((recordMatches.length || pageMatches.length) && targetRange) {
      const portal = portalRef.current;
      const domRange = ReactEditor.toDOMRange(editor, targetRange)
      const rect = domRange.getBoundingClientRect();
      portal.style.top = `${rect.bottom + window.pageYOffset + 5}px`
      portal.style.left = `${rect.left + window.pageXOffset}px`
    }
  }

  render() {
    const { value, className, onFocus, pages, tables } = this.props;
    const { editor, pageMatches, recordMatches, portalRef, selectIndex } = this.state;


    let stringVal;
    if (typeof value === 'string') {
      stringVal = [{ children: [{ text: value}]}]
    }

    let emptyVal;
    if (!value) {
      stringVal = [{ children: [{ text: ''}]}]
    }

    return (
      <div className={classNames('editor', className)}>
        <Slate editor={editor} value={stringVal || emptyVal || value } onChange={this.onChange}>
          <Editable
            renderElement={this.renderElement}
            renderLeaf={this.renderLeaf}
            onKeyDown={this.onKeyDown}
            onBlur={this.handleBlur}
            onFocus={onFocus}
          />
          {
            (pageMatches.length || recordMatches.length) > 0 &&
            <Portal>
              <div
                ref={portalRef}
                className="editor-popover"
              >
                {
                  pageMatches.slice(0, 5).map((p, i) => (
                    <div key={p.key} className={classNames('editor-popover-item', { selected: selectIndex === i})}>
                      <span className="editor-popover-item-path">{getPagePathUtil(p.key, pages).reverse().map(p => pages[p].name + '/')}</span>
                      <span className="editor-popover-item-name">{p.name}</span>
                    </div>
                  ))
                }
                {
                  recordMatches.slice(0, 5).map((r, i) => (
                    <div key={r.__id} className={classNames('editor-popover-item', { selected: selectIndex === i})}>
                      <span className="editor-popover-item-table">{tables[r.__tableId].name}:</span>
                      <span className="editor-popover-item-name">{r.name}</span>
                    </div>
                  ))
                }
              </div>
            </Portal>
          }
        </Slate>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  records: getRecords(state),
  pages: getPages(state),
  pageId: getActivePageId(state),
  tables: getTables(state),
});


export default connect(mapStateToProps)(CustomEditor);