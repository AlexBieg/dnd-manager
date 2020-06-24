import React, { Component } from 'react';
import { createEditor, Transforms, Editor, Text, Range, Node } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import classNames from 'classnames';
import { connect } from 'react-redux';
import fuzzysort from 'fuzzysort';
import { getRecords } from 'reducers/tables';
import { getPages, pagesSetActivePage, getActivePageId } from 'reducers/pages';
import { rollAction } from 'reducers/rolls';

import './Editor.scss';

const DICE_REGEX = /^(^|\s|\()+(?<dice>(\d+)?[dD](\d+)(\s)?([+-](\s)?\d+)?)(\))?$/;

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

  editor.isInline = element => {
    return inlines.includes(element.type) ? true : isInline(element)
  }

  editor.isVoid = element => {
    return inlines.includes(element.type) ? true : isVoid(element)
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

const Element = connect(() => ({}), { setPage: pagesSetActivePage, rollDice: rollAction })(({
  attributes,
  children,
  element,
  setPage,
  rollDice,
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
        <span className="record" contentEditable={false} {...attributes} onClick={() => console.log(element.record.__id)}>
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
    default:
      return <p {...attributes}>{children}</p>
  }
});

class CustomEditor extends Component {
  static defaultProps = {
    onBlur: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      editor: withInline(withReact(createEditor())),
    };
  }

  renderElement = (props) => {
    return <Element {...props} />
  }

  renderLeaf = (props) => {
    return <Leaf {...props} />
  }

  onChange = (newValue) => {
    this.props.onChange(newValue);
  }

  onKeyDown = (event) => {
    const { onNext } = this.props;
    const { editor } = this.state;

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      onNext();
      return;
    }

    if (event.key === 'Enter') {
      const [start] = Range.edges(editor.selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);

      for (let i = 0; i < INLINE_MATCHES.length; i++) {
        const { element, dataProp, regex, searchKey, getData } = INLINE_MATCHES[i];

        const match = (beforeText || '').match(regex);

        if (match) {
          const results = fuzzysort.go(match[1], getData(this.props), { key: searchKey });

          if (results) {
            event.preventDefault();
            Transforms.select(editor, beforeRange);

            const inlineEl = {
              type: element,
              [dataProp]: results[0].obj,
              children: [{ text: '' }],
            };

            Transforms.insertNodes(editor, inlineEl);
            Transforms.move(editor, { distance: 1 });
          }
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
    }

    if (event.key === ' ' && editor.selection) {
      const [currentCursor] = Range.edges(editor.selection);
      const wordStart = Editor.before(editor, currentCursor, { unit: 'word' });
      const prevWordRange = wordStart && Editor.range(editor, wordStart, currentCursor);
      const prevWord = prevWordRange && Editor.string(editor, prevWordRange);

      const match = (prevWord || '').match(DICE_REGEX)

      if (match) {
        Transforms.select(editor, prevWordRange);
        const roller = {
          type: 'roller',
          dice: match[2],
          children: [{ text: '' }]
        }
        Transforms.insertNodes(editor, roller);
        Transforms.move(editor, { distance: 1 });

        if (prevWord.endsWith(')')) {
          Transforms.insertText(editor, ')');
        }
      }

      if (prevWord === '1.') {
        event.preventDefault()
        Transforms.select(editor, prevWordRange);
        Transforms.insertText(editor, '');
        CustomEditorEvents.toggleBlock(editor, 'ordered-list');
      }

      if (prevWord === '*' || prevWord === '-') {
        event.preventDefault()
        Transforms.select(editor, prevWordRange);
        Transforms.insertText(editor, '');
        CustomEditorEvents.toggleBlock(editor, 'list');
      }
    }

    if (event.shiftKey && event.key === '8') {
      event.key = '*';
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
    }
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleBlur);
  }

  componentWillUnmount() {
    this.handleBlur();
    window.removeEventListener('beforeunload', this.handleBlur);
  }

  render() {
    const { value, onBlur } = this.props;
    const { editor } = this.state;


    let stringVal;
    if (typeof value === 'string') {
      stringVal = [{ children: [{ text: value}]}]
    }

    let emptyVal;
    if (!value) {
      stringVal = [{ children: [{ text: ''}]}]
    }

    return (
      <div className="editor">
        <Slate editor={editor} value={stringVal || emptyVal || value } onChange={this.onChange}>
          <Editable
            renderElement={this.renderElement}
            renderLeaf={this.renderLeaf}
            onKeyDown={this.onKeyDown}
            onBlur={onBlur}
          />
        </Slate>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  records: getRecords(state),
  pages: getPages(state),
  pageId: getActivePageId(state),
});

export default connect(mapStateToProps)(CustomEditor);