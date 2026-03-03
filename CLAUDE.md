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

## GROQ Specification Reference

The grammar follows the [GROQ-1.revision4 spec](https://spec.groq.dev/GROQ-1.revision4/).
When making grammar changes, clone the spec source repo for reference:

```sh
git clone --depth 1 --branch "$(git ls-remote --tags https://github.com/sanity-io/groq 'GROQ-1*' | sort -t/ -k3 -V | tail -1 | sed 's|.*refs/tags/||')" https://github.com/sanity-io/groq .drafts/groq
```

The `.drafts/` directory is gitignored. Check spec tags at
https://github.com/sanity-io/groq/tags for newer revisions.

Test corpus files include full spec URLs as `;` comments (e.g.
`; https://spec.groq.dev/GROQ-1.revision4/#sec-Equality`). When adding or
updating spec links, use Chrome DevTools MCP (if available) to verify that
fragment identifiers resolve to actual elements on the spec page.

## Grammar Design

Operator precedence levels (lowest to highest), per GROQ-1.revision4:
PAIR(1), OR(2), AND(3), COMPARE(4), RANGE(5), ADD(6), MUL(7),
UNARY_MINUS(8), EXP(9), UNARY_HIGH(10), POSTFIX(11).

The spec defines comparison operators as non-associative (level 4), but
tree-sitter lacks non-associative support
(https://github.com/tree-sitter/tree-sitter/issues/761), so we use
`prec.left` as a pragmatic fallback.

`*` is both the "everything" primary expression and the multiplication operator;
tree-sitter's precedence disambiguates. `[expr]` is a single `subscript` node
for both filters and element access (semantic disambiguation left to consumers).
`asc`/`desc` are keywords via the `word` property; they cannot be used as
identifiers.
