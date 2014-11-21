function Scaler() {
    this.regex = this.buildRegex();
}
Scaler.prototype = {
    units: [
        '(?:tsp|teaspoon)s?',
        'tbs|tablespoons?',
        'c|cups?',
        '(?:qt|quart)s?'
        // TODO: Add additional units
    ],
    buildRegex: function() {
        // Pattern definitions:
        //     n means a valid (base 10) integer number: e.g., 0, 42, but not 042
        //     0 means any string of digits (even one starting with 0)
        // Patterns for valid numeric values
        // n.?
        // n?.0
        // (n\s+)?n\s*/\s*n
        var reNum = '(?:0|[1-9][0-9]*)',
            // $1=float
            reFloat = '((?:' + reNum + '\\.?)|(?:' + reNum + '?\\.[0-9]+))',
            // $2=[leading number], $3=[numerator], $4=[denominator]
            reFract = '(?:(?:(' + reNum + ')\\s+)?(' + reNum + ')\\s*/\\s*(' + reNum + '))',
            // $5=units
            reUnits = '(' + this.units.join('|') + ')',
            re = '\\b(?:' + reFloat + '|' + reFract + ')\\s*' + reUnits + '\\b';
        return new RegExp(re, "gi");
    },
    convert: function(s, oldCnt, newCnt) {
        var factor = newCnt / oldCnt;
        return s.replace(this.regex, function(match, p1, p2, p3, p4, p5) {
            // Note: Empirically, I've found that capturing groups matching nothing are undefined, but I don't want to
            // rely upon this as I haven't seen it documented.
            var value = !!p1 ? Number(p1) : Number(p2 || 0) + p3 / p4;
            // Scale the value and round the result to a single decimal place, removing a trailing ".0" for aesthetic
            // reasons.
            return Number(value * factor).toFixed(1).replace(/\.0+$/, '') + ' ' + p5;
        });
    },
    // Greatest common factor of 2 input numbers
    gcf: function(n1, n2) {
        var ns = n1 > n2 ? [n1, n2] : [n2, n1];
        var rem;
        while (rem = ns[0] % ns[1]) {
            ns.shift();
            ns.push(rem);
        }
        return ns[1];
    }
};
// vim:ts=4:sw=4:et:tw=120
