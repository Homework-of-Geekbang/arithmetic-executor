function* tokenGen (inputText) {
  let number = '-?[0-9]+\\.[0-9]+|-?[0-9]+'
  let op = '[+\\-*\\/]'
  let regexp = new RegExp(`(?<number>${number})|(?<op>${op})|(?<lb>\\()|(?<rb>\\))|\\s|\\t|\\r|\\n`, 'gy')
  let match = null
  while (match = regexp.exec(inputText)) {
    const {groups: {number, op, lb, rb}} = match
    if (number) {
      yield {type: 'number', value: number}
    } else if (op) {
      yield {type: 'op', value: op}
    } else if (lb) {
      yield {type: 'lb', value: lb}
    } else if (rb) {
      yield {type: 'rb', vlaue: rb}
    }
  }
  yield {type: 'EOF'}
}

const input = '-1.5 + (2 + 4) * 8'
const tokenIter = tokenGen(input)
const ast = parser(tokenIter)
console.log(JSON.stringify(ast, null, 2))

// because it's just a simple expression, we can generate all tokens first here
function parser (tokenIter) {
  return Expression([...tokenIter])
}

/**
 * <Expression> ::=
 *   <AdditiveExpression><EOF>
 */
function Expression (source) {
  if (source[0].type === 'AdditiveExpression' && source[1].type === 'EOF') {
    let node = {
      type: 'Expression',
      children: [source.shift(), source.shift()]
    }
    source.unshift(node)
    return node
  }
  AdditiveExpression(source)
  return Expression(source)
}

/*
 * <AdditiveExpression> ::=
 *   "("<AdditiveExpression>")"
 *   |<MultiplicativeExpression>
 *   |<AdditiveExpression>"+"<MultiplicativeExpression>
 *   |<AdditiveExpression>"-"<MultiplicativeExpression>
 */
function AdditiveExpression (source) {
  if (source[0].type === 'lb' && source[1].type === 'AdditiveExpression' && source[2] === 'rb') {
    let node = {
      type: 'AdditiveExpression',
      children: []
    }
    node.children.push(source.shift())
    node.children.push(source.shift())
    node.children.push(source.shift())
    source.unshift(node)
    return AdditiveExpression(source)
  }
  if (source[0].type === 'MultiplicativeExpression') {
    let node = {
      type: 'AdditiveExpression',
      children: [source[0]]
    }
    source[0] = node
    return node
  }
  if (source[0].type === 'AdditiveExpression'
    && source[1].type === 'op'
    && ['+', '-'].includes(source[1].value)
  ) {
    let node = {
      type: 'AdditiveExpression',
      operator: source[1].value,
      children: []
    }
    node.children.push(source.shift())
    node.children.push(source.shift())
    MultiplicativeExpression(source)
    node.children.push(source.shift())
    source.unshift(node)
    return AdditiveExpression(source)
  }
  if (source[0].type === 'AdditiveExpression')
    return source[0]
  MultiplicativeExpression(source)
  return AdditiveExpression(source)
}

/*
 * <MultiplicativeExpression> ::=
 *   "("<MultiplicativeExpression>")"
 *   |<Number>
 *   |<MultiplicativeExpression>"*"<Number>
 *   |<MultiplicativeExpression>"/"<Number>
 */
function MultiplicativeExpression (source) {
  if (source[0].type === 'lb' && source[1].type === 'MultiplicativeExpression' && source[2] === 'rb') {
    let node = {
      type: 'MultiplicativeExpression',
      children: []
    }
    node.children.push(source.shift())
    node.children.push(source.shift())
    node.children.push(source.shift())
    source.unshift(node)
    return MultiplicativeExpression(source)
  }
  if (source[0].type === 'number') {
    let node = {
      type: 'MultiplicativeExpression',
      children: [source[0]]
    }
    source[0] = node
    return MultiplicativeExpression(source)
  }
    if (source[0].type === 'MultiplicativeExpression' && source[1] && source[1].type === 'op' && ['*', '/'].includes(source[1].value)) {
    let node = {
      type: 'MultiplicativeExpression',
      operator: source[1].value,
      children: []
    }
    node.children.push(source.shift())
    node.children.push(source.shift())
    node.children.push(source.shift())
    source.unshift(node)
    return MultiplicativeExpression(source)
  }
  if (source[0].type === 'MultiplicativeExpression')
    return source[0]
  return MultiplicativeExpression(source)
}
