void function (global) {
  global.executor = executor

  function executor (input) {
    // precheck
    if (!/^[0-9*+-/()\s]+$/.test(input)) throw new Error('unknown charactor')
    const tokenIter = tokenGen(input)
    const ast = parser(tokenIter)
    return evaluate(ast)
  }

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

  function evaluate (node) {
    if (node.type === 'Expression') {
      return evaluate(node.children[0])
    }
    if (node.type === 'AdditiveExpression') {
      if (node.operator === '+') {
        return evaluate(node.children[0]) + evaluate(node.children[1])
      } else if (node.operator === '-') {
        return evaluate(node.children[0]) - evaluate(node.children[1])
      } else {
        return evaluate(node.children[0])
      }
    }
    if (node.type === 'MultiplicativeExpression') {
      if (node.operator === '*') {
        return evaluate(node.children[0]) * evaluate(node.children[1])
      } else if (node.operator === '/') {
        return evaluate(node.children[0]) / evaluate(node.children[1])
      } else {
        return evaluate(node.children[0])
      }
    }
    if (node.type === 'NumberOrExpression') {
      return evaluate(node.children[0])
    }
    if (node.type === 'number') {
      return +node.value
    }
  }

  // because it's just a simple expression, we can generate all tokens first here
  function parser (tokenIter) {
    const tokens = [...tokenIter]
    precheck(tokens)
    return Expression(tokens)
  }

  function precheck (tokens) {
    let duOp
    if (duOp = findDuOp(tokens)) throw new Error(`unexpected operator: ${duOp.value}`)
  }

  function findDuOp (tokens) {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'op' && tokens[i + 1].type === 'op') {
        return tokens[i + 1]
      }
    }
    return null
  }

  /**
   * <Expression> ::=
   *   <AdditiveExpression><EOF>
   *   |<AdditiveExpression>")"
   */
  function Expression (source) {
    if (source[0].type === 'AdditiveExpression' && source[1].type === 'EOF') {
      let node = {
        type: 'Expression',
        children: []
      }
      node.children.push(source.shift())
      source.shift()
      source.unshift(node)
      return node
    }
    if (source[0].type === 'AdditiveExpression' && source[1].type === 'rb') {
      let node = {
        type: 'Expression',
        children: []
      }
      node.children.push(source.shift())
      source.shift()
      source.unshift(node)
      return node
    }
    if (source[0].type === 'Expression')
      return source[0]
    AdditiveExpression(source)
    return Expression(source)
  }

  /*
  * <AdditiveExpression> ::=
  *   |<MultiplicativeExpression>
  *   |<AdditiveExpression>"+"<MultiplicativeExpression>
  *   |<AdditiveExpression>"-"<MultiplicativeExpression>
  */
  function AdditiveExpression (source) {
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
      source.shift()
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
  *   |<NumberOrExpression>
  *   |<MultiplicativeExpression>"*"<NumberOrExpression>
  *   |<MultiplicativeExpression>"/"<NumberOrExpression>
  */
  function MultiplicativeExpression (source) {
    if (source[0].type === 'NumberOrExpression') {
      let node = {
        type: 'MultiplicativeExpression',
        children: [source[0]]
      }
      source[0] = node
      return MultiplicativeExpression(source)
    }
    if (source[0].type === 'MultiplicativeExpression'
      && source[1].type === 'op'
      && ['*', '/'].includes(source[1].value)
    ) {
      let node = {
        type: 'MultiplicativeExpression',
        operator: source[1].value,
        children: []
      }
      node.children.push(source.shift())
      source.shift()
      NumberOrExpression(source)
      node.children.push(source.shift())
      source.unshift(node)
      return MultiplicativeExpression(source)
    }
    if (source[0].type === 'MultiplicativeExpression')
      return source[0]
    NumberOrExpression(source)
    return MultiplicativeExpression(source)
  }

  /**
   * <NumberOrExpression> ::=
   *   <Number>
   *   |"("<Expression>
   */
  function NumberOrExpression (source) {
    if (source[0].type === 'number') {
      let node = {
        type: 'NumberOrExpression',
        children: [source.shift()]
      }
      source.unshift(node)
      return NumberOrExpression(source)
    }
    if (source[0].type === 'lb') {
      let node = {
        type: 'NumberOrExpression',
        children: []
      }
      source.shift()
      Expression(source)
      node.children.push(source.shift())
      source.unshift(node)
      return NumberOrExpression(source)
    }
    if (source[0].type === 'NumberOrExpression') {
      return source[0]
    }
    return NumberOrExpression(source)
  }

}(window)
