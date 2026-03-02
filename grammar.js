/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  OR: 1,
  AND: 2,
  IN_MATCH: 3,
  COMPARE: 4,
  EQUALITY: 5,
  ADD: 6,
  MUL: 7,
  UNARY: 8,
  EXP: 9,
  POSTFIX: 10,
  PIPE: 11,
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
        $.or_expression,
        $.and_expression,
        $.not_expression,
        $.in_expression,
        $.match_expression,
        $.comparison_expression,
        $.equality_expression,
        $.addition_expression,
        $.multiplication_expression,
        $.unary_expression,
        $.exponentiation_expression,
        $.postfix_expression,
        $._primary_expression,
      ),

    or_expression: ($) =>
      prec.left(PREC.OR, seq($._expression, "||", $._expression)),

    and_expression: ($) =>
      prec.left(PREC.AND, seq($._expression, "&&", $._expression)),

    not_expression: ($) => prec.right(PREC.UNARY, seq("!", $._expression)),

    in_expression: ($) =>
      prec.left(PREC.IN_MATCH, seq($._expression, "in", $._expression)),

    match_expression: ($) =>
      prec.left(PREC.IN_MATCH, seq($._expression, "match", $._expression)),

    comparison_expression: ($) =>
      prec.left(
        PREC.COMPARE,
        seq(
          $._expression,
          field("operator", choice("<", "<=", ">", ">=")),
          $._expression,
        ),
      ),

    equality_expression: ($) =>
      prec.left(
        PREC.EQUALITY,
        seq(
          $._expression,
          field("operator", choice("==", "!=")),
          $._expression,
        ),
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

    unary_expression: ($) =>
      prec.right(PREC.UNARY, seq(choice("+", "-"), $._expression)),

    exponentiation_expression: ($) =>
      prec.right(PREC.EXP, seq($._expression, "**", $._expression)),

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

    subscript: ($) =>
      seq(
        "[",
        choice(
          seq($._expression, choice("..", "..."), $._expression),
          $._expression,
        ),
        "]",
      ),

    array_postfix: () => seq("[", "]"),

    projection: ($) =>
      seq(
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

    _projection_entry: ($) =>
      choice($.spread, $.pair, $.alias_entry, $._expression),

    alias_entry: ($) =>
      seq(field("key", $._expression), ":", field("value", $._expression)),

    spread: ($) => seq("...", optional($._expression)),

    pair: ($) => seq($._expression, "=>", $._expression),

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
            seq(
              choice($.sort_expression, $.pair, $._expression),
              repeat(
                seq(",", choice($.sort_expression, $.pair, $._expression)),
              ),
              optional(","),
            ),
          ),
          ")",
        ),
      ),

    namespaced_identifier: ($) =>
      seq(field("namespace", $.identifier), "::", field("name", $.identifier)),

    sort_expression: ($) =>
      prec(PREC.POSTFIX, seq($._expression, choice("asc", "desc"))),

    function_declaration: ($) =>
      seq(
        "function",
        field("name", choice($.namespaced_identifier, $.identifier)),
        "(",
        optional(seq($.parameter, repeat(seq(",", $.parameter)))),
        ")",
        "=>",
        field("body", $._expression),
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
