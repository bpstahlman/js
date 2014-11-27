function Fraction(whole, numer, denom, scaleNumer, scaleDenom) {
    // Convert scaled mixed number to (potentially improper) fraction.
    // Defer setting of whole number.
    this.w = undefined;
    this.n = scaleNumer * (whole * denom + numer);
    this.d = scaleDenom * denom;
    // Will be set false if exact denom not nice.
    this.isNice = true;
    // If non-nice fraction is approximated by one with "nice" denom, pctErr will be set to the % error.
    this.pctErr = undefined;
    this.normalize();
}
Fraction.prototype = {
    niceDenoms: [2, 3, 4, 5, 8],
    acceptablePctErr: 5,
    // Convert a simple fraction to the even simpler whole number form if possible, returning true if conversion
    // performed.
    convertSpecial: function() {
        if (this.n === this.d) {
            this.w = 1;
        } else if (this.d === 1) {
            this.w = this.n;
        } else if (this.n % this.d === 0) {
            this.w = this.n / this.d;
        } else if (!this.n) {
            this.w = 0;
        } else {
            // No special conversion possible.
            return false;
        }
        // Will get here only if special conversion performed.
        this.n = this.d = undefined;
        return true;
    },
    // Normalize the scaled fraction.
    // Input is in simple form, but output should be in mixed or simple whole number form, approximated to "nice"
    // denominator if possible.
    normalize: function() {
        // Reduce the (potentially improper) fraction if possible.
        var gcf = this.gcf(this.n, this.d);
        if (gcf > 1) {
            this.n /= gcf;
            this.d /= gcf;
        }
        // Convert to (potentially) mixed number, handling some special cases.
        if (!this.convertSpecial()) {
            // Approximate if denom not nice.
            if (this.niceDenoms.indexOf(this.d) === -1) {
                this.isNice = false;
                if (this.approximate()) {
                    // We were able to approximate; make sure approx fraction isn't special: e.g.,
                    // 15/16 becomes 16/16
                    // 17/4 becomes 16/4
                    this.convertSpecial();
                }
            }
            // Even if approximation failed, convert back to proper mixed form (unless convertSpecial has already
            // produced whole number form admitting no further simplification).
            if (this.d && this.n > this.d) {
                // Improper fraction.
                this.w = Math.floor(this.n / this.d);
                this.n = this.n % this.d;
            }
        }
    },
    // Convert an ugly fraction to a nice one if we can do so without introducing too much error.
    // Input: Non-nice simple fraction, possibly improper.
    // Return: true indicates approximation performed, in which case this.pctErr gives error.
    approximate: function() {
        var denoms = this.niceDenoms,
            ln = denoms.length;
        for (var i = 0; i < ln; i++) {
            var d = denoms[i],
                dRatio = this.d / d,
                nApprox = this.n / dRatio,
                nApproxInt = Math.round(nApprox),
                nErr = Math.abs(nApprox - nApproxInt),
                pctErr = Math.round(100 * nErr / d);
            // This is approximation.
            // Design Decision: Don't allow approximation to result in 0.
            if (nApproxInt && pctErr < this.acceptablePctErr) {
                this.d = d;
                this.n = nApproxInt;
                this.pctErr = pctErr;
                return true;
            }
        }
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
    },
    toString: function() {
        if (this.isNice || this.pctErr !== undefined) {
            // Use fraction
            if (this.n === undefined) {
                // Pure integer - not mixed number
                return this.w + "";
            } else {
                // Mixed fraction (possibly with 0 whole number part)
                return (this.w ? this.w + " ": "") + this.n + "/" + this.d;
            }
        } else {
            // Use float
            var value = (this.w || 0) + (this.n || 0) / (this.d || 1);
            return value.toFixed(1).replace(/\.0+$/, '');
        }
    }
};

function Scaler() {
    this.regex = this.buildRegex();
}
Scaler.prototype = {
    units: [
        // Source: http://en.wikibooks.org/wiki/Cookbook:Units_of_measurement
        // Note: Erring on side of allowing technically incorrect formats: e.g.,
        // "tsps" (no "." and trailing "s")
        // Volume
        't|tsps?|teaspoons?',
        'tbl|tbs|tbsps?|tablespoons?',
        '(?:(?:fl|fluid)\\s+)?(?:oz|ounces?)',
        'gills?',
        'c|cups?',
        '(?:(?:fl|fluid)\\s+)?(?:p|pts?|pints?)',
        '(?:(?:fl|fluid)\\s+)?(?:q|qts?|quarts?)',
        'g|gals?|gallons?',
        'ml?|milliliters?|millilitres?|cc',
        'l|liters?|litres?',
        'dl|deciliters?|decilitres?',
        // Mass and Weight
        'lbs?|#|pounds?',
        'mg|milligrams?|milligrammes?',
        'g|grams?|grammes?',
        'kgs?|kilograms?|kilogrammes?'
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
            // Note: Empirically, I've found that capturing groups matching nothing are undefined, but I don't want to
            // rely upon this as I haven't seen it documented.
            if (!!p2) {
                var value = newCnt * p2 / oldCnt;
                // Scale the value and round the result to a single decimal place, removing any trailing ".0" for
                // aesthetic reasons.
                return value.toFixed(1).replace(/\.0+$/, '') + ' ' + p6;
            } else {
                // Try to keep as (potentially mixed) fraction (i.e., avoid conversion to float)
                var w = Number(p1 || p3 || 0),
                    n = Number(p4 || 0),
                    d = Number(p5 || 1),
                    fraction = new Fraction(w, n, d, newCnt, oldCnt);
                return fraction.toString() + ' ' + p6;
            }
        });
    }
};
// vim:ts=4:sw=4:et:tw=120
