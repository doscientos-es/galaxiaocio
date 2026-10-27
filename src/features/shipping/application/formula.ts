/**
 * Price formulas written by the team, e.g. `4,9 + 0,18 * ceil(kg)` or `max(98; 60 + 0,1 * kg)`.
 * They are read by a small parser instead of `eval`, so a formula can never run arbitrary code.
 *
 * Variables:  kg (weight of the shipment), bultos (number of packages)
 * Operators:  + - * /  and parentheses
 * Functions:  max(a; b; …)  min(a; b; …)  ceil(x)  floor(x)  round(x)
 * Numbers:    decimals with comma or dot. Arguments are separated with `;`.
 * The result is the price in euros.
 */
export interface FormulaVariables {
  kg: number
  bultos: number
}

export type FormulaResult = { ok: true; value: number } | { ok: false; error: string }

type Token =
  | { type: 'number'; value: number }
  | { type: 'name'; value: string }
  | { type: 'symbol'; value: string }

class FormulaError extends Error {}

const functions: Record<string, { min: number; max: number; run: (args: number[]) => number }> = {
  max: { min: 1, max: Infinity, run: (args) => Math.max(...args) },
  min: { min: 1, max: Infinity, run: (args) => Math.min(...args) },
  ceil: { min: 1, max: 1, run: ([x = 0]) => Math.ceil(x) },
  floor: { min: 1, max: 1, run: ([x = 0]) => Math.floor(x) },
  round: { min: 1, max: 1, run: ([x = 0]) => Math.round(x) },
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let index = 0
  while (index < source.length) {
    const rest = source.slice(index)
    const space = /^\s+/.exec(rest)
    const number = /^\d+(?:[.,]\d+)?/.exec(rest)
    const name = /^[a-zA-Z]+/.exec(rest)
    if (space) index += space[0].length
    else if (number) {
      tokens.push({ type: 'number', value: Number(number[0].replace(',', '.')) })
      index += number[0].length
    } else if (name) {
      tokens.push({ type: 'name', value: name[0].toLowerCase() })
      index += name[0].length
    } else if ('+-*/×();'.includes(rest.charAt(0))) {
      tokens.push({ type: 'symbol', value: rest.charAt(0) === '×' ? '*' : rest.charAt(0) })
      index += 1
    } else if (rest.charAt(0) === ',') {
      throw new FormulaError('Separa los argumentos con «;». La coma es para los decimales.')
    } else {
      throw new FormulaError(`Carácter no permitido: «${rest.charAt(0)}».`)
    }
  }
  return tokens
}

class Parser {
  private position = 0

  constructor(
    private readonly tokens: Token[],
    private readonly variables: FormulaVariables,
  ) {}

  run(): number {
    if (this.tokens.length === 0) throw new FormulaError('La fórmula está vacía.')
    const value = this.expression()
    if (this.position < this.tokens.length)
      throw new FormulaError('Sobra algo al final de la fórmula.')
    return value
  }

  private peekSymbol(): string | undefined {
    const token = this.tokens[this.position]
    return token?.type === 'symbol' ? token.value : undefined
  }

  private expect(symbol: string): void {
    if (this.peekSymbol() !== symbol) throw new FormulaError(`Falta «${symbol}».`)
    this.position += 1
  }

  private expression(): number {
    let value = this.term()
    for (
      let symbol = this.peekSymbol();
      symbol === '+' || symbol === '-';
      symbol = this.peekSymbol()
    ) {
      this.position += 1
      value = symbol === '+' ? value + this.term() : value - this.term()
    }
    return value
  }

  private term(): number {
    let value = this.unary()
    for (
      let symbol = this.peekSymbol();
      symbol === '*' || symbol === '/';
      symbol = this.peekSymbol()
    ) {
      this.position += 1
      value = symbol === '*' ? value * this.unary() : value / this.unary()
    }
    return value
  }

  private unary(): number {
    if (this.peekSymbol() === '-') {
      this.position += 1
      return -this.unary()
    }
    return this.primary()
  }

  private primary(): number {
    const token = this.tokens[this.position]
    if (!token) throw new FormulaError('La fórmula termina antes de tiempo.')
    this.position += 1
    if (token.type === 'number') return token.value
    if (token.type === 'symbol') {
      if (token.value !== '(') throw new FormulaError(`No se esperaba «${token.value}».`)
      const value = this.expression()
      this.expect(')')
      return value
    }
    if (this.peekSymbol() === '(') return this.call(token.value)
    if (token.value === 'kg' || token.value === 'bultos') return this.variables[token.value]
    throw new FormulaError(`«${token.value}» no existe. Usa kg o bultos.`)
  }

  private call(name: string): number {
    // hasOwn: names like `constructor` must not resolve to inherited object members.
    const fn = Object.hasOwn(functions, name) ? functions[name] : undefined
    if (!fn)
      throw new FormulaError(`La función «${name}» no existe. Usa max, min, ceil, floor o round.`)
    this.expect('(')
    const args = [this.expression()]
    while (this.peekSymbol() === ';') {
      this.position += 1
      args.push(this.expression())
    }
    this.expect(')')
    if (args.length < fn.min || args.length > fn.max) {
      throw new FormulaError(`«${name}» no admite ${args.length} argumento(s).`)
    }
    return fn.run(args)
  }
}

/** Calculates a formula. Never throws: problems come back as a readable message. */
export function evaluateFormula(formula: string, variables: FormulaVariables): FormulaResult {
  try {
    const value = new Parser(tokenize(formula), variables).run()
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: 'El resultado no es un precio válido.' }
    }
    return { ok: true, value }
  } catch (error) {
    if (error instanceof FormulaError) return { ok: false, error: error.message }
    throw error
  }
}
