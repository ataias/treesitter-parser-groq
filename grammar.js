/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence levels from the GROQ-1.revision4 spec:
// https://spec.groq.dev/GROQ-1.revision4/#sec-Precedence-and-associativity
const PREC = {
  PAIR: 1, // =>
  OR: 2, // ||
  AND: 3, // &&
  // GROQ spec: comparison operators are non-associative at level 4.
  // https://spec.groq.dev/GROQ-1.revision4/#sec-Precedence-and-associativity
  // tree-sitter lacks non-associative support:
  // https://github.com/tree-sitter/tree-sitter/issues/761
  // We use prec.left as a pragmatic fallback. This means the parser accepts
  // `a == b < c` (parsing left-to-right) rather than rejecting it.
  // This does not affect syntax highlighting or formatting.
  COMPARE: 4, // ==, !=, <, <=, >, >=, in, match, asc, desc
  RANGE: 5, // .., ...
  ADD: 6, // +, -
  MUL: 7, // *, /, %
  UNARY_MINUS: 8, // - (prefix)
  EXP: 9, // **
  UNARY_HIGH: 10, // +, ! (prefix)
  POSTFIX: 11, // traversals, pipes
};

export default grammar({
  name: "groq",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: () => [],

  rules: {
    source_file: ($) =>
      seq(repeat($.function_declaration), optional($._expression)),

    _expression: ($) =>
      choice(
        $.pair,
        $.or_expression,
        $.and_expression,
        $.not_expression,
        $.comparison_expression,
        $.asc_expression,
        $.desc_expression,
        $.range_expression,
        $.addition_expression,
        $.multiplication_expression,
        $.unary_minus_expression,
        $.exponentiation_expression,
        $.unary_plus_expression,
        $.postfix_expression,
        $._primary_expression,
      ),

    pair: ($) => prec.left(PREC.PAIR, seq($._expression, "=>", $._expression)),

    or_expression: ($) =>
      prec.left(PREC.OR, seq($._expression, "||", $._expression)),

    and_expression: ($) =>
      prec.left(PREC.AND, seq($._expression, "&&", $._expression)),

    not_expression: ($) => prec.right(PREC.UNARY_HIGH, seq("!", $._expression)),

    comparison_expression: ($) =>
      prec.left(
        PREC.COMPARE,
        seq(
          $._expression,
          field(
            "operator",
            choice("==", "!=", "<", "<=", ">", ">=", "in", "match"),
          ),
          $._expression,
        ),
      ),

    asc_expression: ($) => prec.left(PREC.COMPARE, seq($._expression, "asc")),

    desc_expression: ($) => prec.left(PREC.COMPARE, seq($._expression, "desc")),

    range_expression: ($) =>
      prec.left(
        PREC.RANGE,
        seq($._expression, choice("..", "..."), $._expression),
      ),

    addition_expression: ($) =>
      prec.left(
        PREC.ADD,
        seq($._expression, field("operator", choice("+", "-")), $._expression),
      ),

    multiplication_expression: ($) =>
      prec.left(
        PREC.MUL,
        seq(
          $._expression,
          field("operator", choice("*", "/", "%")),
          $._expression,
        ),
      ),

    unary_minus_expression: ($) =>
      prec.right(PREC.UNARY_MINUS, seq("-", $._expression)),

    exponentiation_expression: ($) =>
      prec.right(PREC.EXP, seq($._expression, "**", $._expression)),

    unary_plus_expression: ($) =>
      prec.right(PREC.UNARY_HIGH, seq("+", $._expression)),

    postfix_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          $._expression,
          choice(
            $.attribute_access,
            $.subscript,
            $.array_postfix,
            $.projection,
            $.dereference,
            $.pipe_call,
          ),
        ),
      ),

    attribute_access: ($) => seq(".", $.identifier),

    subscript: ($) => seq("[", $._expression, "]"),

    array_postfix: () => seq("[", "]"),

    projection: ($) =>
      seq(
        optional("|"),
        "{",
        optional(
          seq(
            $._projection_entry,
            repeat(seq(",", $._projection_entry)),
            optional(","),
          ),
        ),
        "}",
      ),

    _projection_entry: ($) => choice($.spread, $.alias_entry, $._expression),

    alias_entry: ($) =>
      seq(field("key", $._expression), ":", field("value", $._expression)),

    spread: ($) => seq("...", optional($._expression)),

    dereference: ($) =>
      prec.left(PREC.POSTFIX, seq("->", optional($.identifier))),

    pipe_call: ($) => seq("|", $.function_call),

    _primary_expression: ($) =>
      choice(
        $.parenthesized_expression,
        $.everything,
        $.this,
        $.parent,
        $.parameter,
        $.function_call,
        $.identifier,
        $.null,
        $.true,
        $.false,
        $.number,
        $.string,
        $.array,
        $.object,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    everything: () => "*",
    this: () => "@",
    parent: () => token(seq("^", repeat(seq(".", "^")))),

    parameter: ($) => seq("$", $.identifier),

    function_call: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("name", choice($.namespaced_identifier, $.identifier)),
          "(",
          optional(
            seq($._expression, repeat(seq(",", $._expression)), optional(",")),
          ),
          ")",
        ),
      ),

    namespaced_identifier: ($) =>
      seq(field("namespace", $.identifier), "::", field("name", $.identifier)),

    // https://spec.groq.dev/GROQ-1.revision4/#sec-Function-Definition
    // FuncDecl : fn FuncNamespace FuncIdentifier FuncParams = FuncBody ;
    function_declaration: ($) =>
      seq(
        "fn",
        field("name", $.namespaced_identifier),
        "(",
        optional(seq($.identifier, repeat(seq(",", $.identifier)))),
        ")",
        "=",
        field("body", $._expression),
        ";",
      ),

    null: () => "null",
    true: () => "true",
    false: () => "false",

    number: () =>
      token(
        seq(
          choice("0", seq(/[1-9]/, repeat(/[0-9]/))),
          optional(seq(".", repeat1(/[0-9]/))),
          optional(
            seq(choice("e", "E"), optional(choice("+", "-")), repeat1(/[0-9]/)),
          ),
        ),
      ),

    string: ($) => choice($._double_string, $._single_string),

    _double_string: ($) =>
      seq(
        '"',
        repeat(choice($._double_string_content, $.escape_sequence)),
        '"',
      ),

    _single_string: ($) =>
      seq(
        "'",
        repeat(choice($._single_string_content, $.escape_sequence)),
        "'",
      ),

    _double_string_content: () => token.immediate(prec(1, /[^"\\]+/)),
    _single_string_content: () => token.immediate(prec(1, /[^'\\]+/)),

    escape_sequence: () =>
      token.immediate(
        seq(
          "\\",
          choice(
            /['"\\/bfnrt]/,
            seq("u", /[0-9a-fA-F]{4}/),
            seq("u{", /[0-9a-fA-F]{1,6}/, "}"),
          ),
        ),
      ),

    array: ($) =>
      seq(
        "[",
        optional(
          seq(
            $._array_element,
            repeat(seq(",", $._array_element)),
            optional(","),
          ),
        ),
        "]",
      ),

    _array_element: ($) => choice(seq("...", $._expression), $._expression),

    object: ($) =>
      seq(
        "{",
        optional(
          seq(
            $._object_entry,
            repeat(seq(",", $._object_entry)),
            optional(","),
          ),
        ),
        "}",
      ),

    _object_entry: ($) =>
      choice(
        $.spread,
        seq(
          field("key", choice($.string, $.identifier)),
          ":",
          field("value", $._expression),
        ),
        $._expression,
      ),

    identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,

    comment: () => token(seq("//", /.*/)),
  },
});
