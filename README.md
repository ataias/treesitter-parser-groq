# tree-sitter-groq

> **Work in progress** -- This grammar covers the core of GROQ but may not
> handle every edge case yet. Bug reports and contributions are welcome.

A [Tree-sitter](https://tree-sitter.github.io/) grammar for
[GROQ](https://spec.groq.dev/GROQ-1.revision4/) (Graph-Relational Object Queries),
Sanity.io's query language.

## Features

- Full operator precedence (logical, comparison, arithmetic, exponentiation)
- Traversals: attribute access (`.field`), subscripts (`[expr]`), array postfix
  (`[]`), slices (`[a..b]`, `[a...b]`), dereferences (`->`), projections
  (`{...}`), pipes (`| order(...)`)
- Functions: regular and namespaced (`array::join`, `math::sum`, `geo::distance`)
- Sort expressions (`asc`/`desc`) inside `order()`
- Condition-value pairs (`=>`) in `select()` and projections
- Special expressions: `*` (everything), `@` (this), `^` / `^.^.^` (parent),
  `$param` (parameters)
- Literals: null, booleans, numbers (including scientific notation),
  single/double-quoted strings with escape sequences, arrays, objects
- Spreads (`...`), function declarations, line comments (`//`)
- Syntax highlighting queries for editor integration

## Bindings

| Language | Path |
|----------|------|
| C        | `bindings/c/` |
| Go       | `bindings/go/` |
| Node.js  | `bindings/node/` |
| Python   | `bindings/python/` |
| Rust     | `bindings/rust/` |
| Swift    | `bindings/swift/` |

## Usage

### Building

```sh
bun install
bun run build:dev
```

### Testing

```sh
bun run test
```

### Parsing a file

```sh
bun run parse examples/blog.groq
```

### Rust

```rust
let mut parser = tree_sitter::Parser::new();
let language = tree_sitter_groq::LANGUAGE;
parser
    .set_language(&language.into())
    .expect("Error loading Groq parser");
let tree = parser.parse("*[_type == \"movie\"]{title}", None).unwrap();
```

## Example

```groq
*[_type == "post" && !(_id in path("drafts.**"))]{
  title,
  slug,
  "author": author->{name, "avatar": image.asset->url},
  "categories": categories[]->{ title, slug },
  "commentCount": count(*[_type == "comment" && references(^._id)])
} | order(publishedAt desc)[0..9]
```

## References

- [GROQ specification (GROQ-1.revision4)](https://spec.groq.dev/GROQ-1.revision4/)
- [GROQ specification source](https://github.com/sanity-io/groq)
- [GROQ cheat sheet](https://www.sanity.io/docs/query-cheat-sheet)
- [Tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/)

## License

MIT
