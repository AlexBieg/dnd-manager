import React from 'react';
import classNames from 'classnames';
import ContentEditable from 'react-contenteditable';
import { connect } from 'react-redux';
import fuzzsort from 'fuzzysort';
import { get } from 'lodash';
import { getPagesArray, pagesSetActivePage } from 'reducers/pages';
import { rollAction } from 'reducers/rolls';
import { getRecords } from 'reducers/tables';
import VirtualizedTable from 'components/VirtualizedTable';
import TableSelector from 'components/TableSelector';

import './MultiMediaInput.scss';

const pageLinkRegex = /(^|\s)#(?<term>([a-zA-Z0-9])+)/;
const formatRegex = /(^|\s)\/(?<format>([a-zA-Z0-9])+)/;
const recordLinkRegex = /(^|\s)@(?<record>([a-zA-Z0-9])+)/;
const tableRegex = /^@@(?<tableId>[a-zA-Z0-9-]+)@@$/;
const diceRegexGlobal = /(^|\s)+(\d+)?[dD](\d+)(\s)?([+-](\s)?\d+)?/g;

const formatOptions = {
  callout: '<div class="callout">Callout...</div>',
  quote: '<div class="quote">Quote...</div>',
  ul: '<ul><li>Item 1</li></ul>',
  ol: '<ol><li>Item 1</li></ol>',
  h1: '<h1>H1</h1>',
  h2: '<h2>H2</h2>',
  h3: '<h3>H3</h3>',
  table: '@@select@@'
}

class MultiMediaInput extends React.Component {
  static defaultProps = {
    value: '',
    onFocus: () => {},
    onChange: () => {},
    onBlur: () => {},
    onKeyDown: () => {},
    disabled: false,
    style: {},
  }

  constructor(props) {
    super(props);

    this.contentEditable = React.createRef();

    this.state = {
      isFocused: false,
      bestPageMatch: null,
      bestFormatMatch: null,
      bestRecordMatch: null,
    }
  }

  onKeyDownInner = (event) => {
    const { bestPageMatch, bestFormatMatch, bestRecordMatch } = this.state;
    const { onKeyDown, value, onChange } = this.props;

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      if (bestPageMatch) {
        event.preventDefault();
        event.stopPropagation();
        const link = ` <a href="#" class="page-link" page="${bestPageMatch.id}">${bestPageMatch.name}</a>`
        const newVal = value.replace(pageLinkRegex, link);
        onChange({ target: { value: newVal } });
        return;
      }

      if (bestFormatMatch) {
        event.preventDefault();
        event.stopPropagation();
        const format = formatOptions[bestFormatMatch];
        if (typeof format === 'string') {
          const newVal = value.replace(formatRegex, format);
          onChange({ target: { value: newVal }});
        } else {
          format();
        }
        return;
      }

      if (bestRecordMatch) {
        event.preventDefault();
        event.stopPropagation();

        const link = ` <a href="#" class="record-link" record="${bestRecordMatch.__id}">${bestRecordMatch.name}</a>`
        const newVal = value.replace(recordLinkRegex, link);
        onChange({ target: { value: newVal }});
        return;
      }
    }

    const isEmpty = value.length === 0 || value === '<br>';

    onKeyDown(event, isEmpty);
  }

  onClick = (e) => {
    if (e.target.className === 'page-link') {
      const attrs = e.target.attributes;
      this.props.pagesSetActivePage(attrs.getNamedItem('page').value);
    } else if (e.target.className === 'dice') {
      this.props.rollAction(e.target.innerHTML);
    }
  }

  setFocus = () => {
    const ce = this.contentEditable.current;
    if (ce) {
      ce.focus();
    }
  }

  componentDidUpdate() {
    const { isFocused, bestPageMatch, bestFormatMatch, bestRecordMatch } = this.state;
    const { value, pages, focus, records } = this.props;

    const pageLinkMatch = value.match(pageLinkRegex);
    if (pageLinkMatch && isFocused) {
      const pageMatches = fuzzsort.go(pageLinkMatch.groups.term, pages, { key: 'name' });
      const bestMatch = get(pageMatches, '0.obj', {});

      if (bestMatch.id !== get(bestPageMatch, 'id')) {
        this.setState({ bestPageMatch: bestMatch });
      }
    } else if (bestPageMatch) {
      this.setState({ bestPageMatch: null });
    }

    const formatMatch = value.match(formatRegex);
    if (formatMatch && isFocused) {
      const formatMatches = fuzzsort.go(formatMatch.groups.format, Object.keys(formatOptions));

      if (bestFormatMatch !== get(formatMatches, '0.target')) {
        this.setState({ bestFormatMatch: get(formatMatches, '0.target') });
      }
    } else if (bestFormatMatch) {
      this.setState({ bestFormatMatch: null });
    }

    const recordRegexMatch = value.match(recordLinkRegex);
    if (recordRegexMatch && isFocused) {
      const recordMatches = fuzzsort.go(recordRegexMatch.groups.record, Object.values(records), { key: 'name' });
      if (get(bestRecordMatch, '__id') !== get(recordMatches, '0.obj.__id')) {
        this.setState({ bestRecordMatch: get(recordMatches, '0.obj') })
      }
    } else if (bestRecordMatch) {
      this.setState({ bestRecordMatch: null });
    }

    if (!isFocused && focus) {
      this.setFocus();
    }
  }

  componentDidMount() {
    const { focus } = this.props;
    if (focus) {
      this.setFocus();
    }
  }

  onFocus = (e) => {
    const { onFocus } = this.props;
    this.setState({ isFocused: true })
    onFocus(e);
  }

  onBlur = () => {
    const { value, onChange, onBlur } = this.props;
    const diceMatches = [...value.matchAll(diceRegexGlobal)];
    if (diceMatches.length) {

      let newValue = value;

      diceMatches.forEach((matchList) => {
        const match = matchList[0];
        const fixedMatch = match.replace(/(\s)*/g, '');
        newValue = newValue.replace(match, ` <a href="#" class="dice">${fixedMatch}</a> `);
      });

      onChange({ target: { value: newValue } });
    }
    this.setState({ isFocused: false });
    onBlur();
  }

  onChangeInner = (e) => {
    const { value } = this.props;

    if (e.target.value !== value) {
      this.props.onChange(e)
    }
  }

  onSelectTable = (id) => {
    const { onChange } = this.props;
    if (!id) {
      onChange({ target: { value: '' }});
    } else {
      onChange({ target: { value: `@@${id}@@`}})
    }
  }

  render() {
    const {
      className,
      value,
      disabled,
      style,
      index,
    } = this.props;

    // try {
    //   const url = new URL(value);

    //   return <img alt="" className="image" src={value} />;
    // } catch (e) {
    // }


    const tableMatch = (value).match(tableRegex);

    if (tableMatch) {
      const id = tableMatch.groups.tableId
      if (id === 'select') {
        return <TableSelector onChange={this.onSelectTable} />
      }
      return (
        <VirtualizedTable id={id} />
      )
    }

    return (
      <ContentEditable
        index={index}
        style={style}
        disabled={disabled}
        innerRef={this.contentEditable}
        onFocus={(e) => this.onFocus(e)}
        onBlur={() => this.onBlur()}
        onChange={this.onChangeInner}
        className={classNames('multimedia-input', className)}
        onKeyDown={this.onKeyDownInner}
        onMouseDown={this.onClick}
        html={value}
        tagName="pre"
      />
    );
  }
}

const mapStateToProps = (state) => {
  return {
    pages: getPagesArray(state),
    records: getRecords(state),
  }
}

const mapDispatchToProps = {
  pagesSetActivePage,
  rollAction,
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiMediaInput);