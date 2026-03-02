# tree-sitter-groq

## Build and Test

```sh
bun install
bun run build:dev    # generate parser
bun run test         # run tree-sitter test corpus
bun run lint         # lint grammar.js with biome
bun run format       # format grammar.js with biome
cargo test           # run Rust binding tests
```

## Project Structure

- `grammar.js` -- Tree-sitter grammar definition (ESM, uses `export default`)
- `src/` -- Generated parser (C); do not edit by hand
- `queries/highlights.scm` -- Syntax highlighting queries
- `test/corpus/` -- Tree-sitter test files (`.txt` format)
- `examples/` -- Sample `.groq` files for manual testing
- `bindings/` -- Language bindings (C, Go, Node, Python, Rust, Swift, Zig)

## Workflow

1. Edit `grammar.js`
2. Run `bun run build:dev` to regenerate `src/parser.c`
3. Run `bun run test` to verify all tests pass
4. Parse example files with `bun run parse examples/<file>.groq`

## Grammar Design

Operator precedence levels (lowest to highest): OR, AND, IN/MATCH, COMPARE,
EQUALITY, ADD, MUL, UNARY, EXP, POSTFIX, PIPE.

`*` is both the "everything" primary expression and the multiplication operator;
tree-sitter's precedence disambiguates. `[expr]` is a single `subscript` node
for both filters and element access (semantic disambiguation left to consumers).
`asc`/`desc` are keywords via the `word` property; they cannot be used as
identifiers.
