;; Keywords
(null) @constant.builtin
(true) @boolean
(false) @boolean
["in" "match" "asc" "desc" "fn"] @keyword

;; Literals
(number) @number
(string) @string
(escape_sequence) @string.escape

;; Comments
(comment) @comment

;; Special expressions
(everything) @constant.builtin
(this) @variable.special
(parent) @variable.special

;; Parameters
(parameter "$" @punctuation.special)
(parameter (identifier) @variable)

;; Identifiers
(identifier) @variable
(attribute_access "." (identifier) @property)

;; Functions
(function_call
  name: (identifier) @function)
(function_call
  name: (namespaced_identifier
    namespace: (identifier) @function
    name: (identifier) @function))
(function_declaration "fn" @keyword)
(function_declaration
  name: (namespaced_identifier
    namespace: (identifier) @function
    name: (identifier) @function))

;; Operators
["==" "!=" "<" "<=" ">" ">="] @operator
["+" "-" "/" "%" "**"] @operator
["&&" "||" "!"] @operator
["=>" "->" "="] @operator
[".." "..."] @operator
"|" @operator

;; Punctuation
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["." "," ":" "::"] @punctuation.delimiter

;; Alias entries in projections
(alias_entry
  key: (_) @property)
