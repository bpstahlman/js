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
        // n
        // n.
        // n?.0
        // (n\s+)?n\s*/\s*n
        var reNum = '(?:0|[1-9][0-9]*)',
            // $1=integ
            reInteg = '(' + reNum + ')',
            // $2=float
            reFloat = '((?:' + reNum + '\\.?)|(?:' + reNum + '?\\.[0-9]+))',
            // $3=[leading number], $4=[numerator], $5=[denominator]
            reFract = '(?:(?:(' + reNum + ')\\s+)?(' + reNum + ')\\s*/\\s*(' + reNum + '))',
            // $6=units
            reUnits = '(' + this.units.join('|') + ')',
            re = '\\b(?:' + reInteg + '|' + reFloat + '|' + reFract + ')\\s*' + reUnits + '\\b';
        return new RegExp(re, "gi");
    },
    convert: function(s, oldCnt, newCnt) {
        var me = this,
            factor = newCnt / oldCnt;
        return s.replace(this.regex, function(match, p1, p2, p3, p4, p5, p6) {
            var value;
            // Note: Empirically, I've found that capturing groups matching nothing are undefined, but I don't want to
            // rely upon this as I haven't seen it documented.
            if (!!p2) {
                value = newCnt * Number(p2) / oldCnt;
            } else {
                // Try to keep as (potentially mixed) fraction (i.e., avoid conversion to float)
                var w = Number(p1 || p3 || 0),
                    n = Number(p4 || 0),
                    d = Number(p5 || 1);
                // Convert mixed number to (potentially improper) fraction.
                var n = w * d + n;
                // Scale it by newCnt/oldCnt, also as (potentially improper) fraction
                n *= newCnt;
                d *= oldCnt;
                // Reduce the fraction if possible.
                var gcf = me.gcf(n, d);
                if (gcf > 1) {
                    n /= gcf;
                    d /= gcf;
                }
                // TODO: Do the following only for certain nice denominators; else convert to float val and
                // fall-through...
                // Convert to (potentially) mixed number.
                if (n === d) {
                    value = 1;
                } else if (d === 1) {
                    value = n;
                } else {
                    // TODO: Leave as float if denom not nice...
                    if (n > d) {
                        // Improper fraction.
                        // !!!!UNDER CONSTRUCTION!!!!
                        w = Math.floor(n / d);
                        n = n % d;
                        value = w + " " + n + "/" + d;
                    } else {
                        value = n + "/" + d;
                    }
                    return value + ' ' + p6;
                }
            }
            // If we get here, couldn't or didn't want to display mixed fraction.
            // Scale the value and round the result to a single decimal place, removing a trailing ".0" for aesthetic
            // reasons.
            return Number(value).toFixed(1).replace(/\.0+$/, '') + ' ' + p6;
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
