$(document).ready(function() {
    var scaler = new Scaler();
    // Initialize some controls to sensible defaults
    $('#orig-cnt').val(2);
    $('#conv-cnt').val(4);
    $('.cnt-spinner').attr('min', 1);
    $('#conv-button').click(function() {
        var origCnt = $('#orig-cnt').val(),
            convCnt = $('#conv-cnt').val();
        // Assumption: val() returns empty string if non-number in input ctl; otherwise, number.
        // Note: Only nonzero integers are valid choices.
        if (origCnt && convCnt) {
            var convRecipe = scaler.convert($('#orig-recipe').val(), origCnt, convCnt);
            $('#conv-recipe').val(convRecipe);
        } else {
            alert('Invalid count(s) specified: only nonzero integers permitted.');
        }
    });
});

// vim:ts=4:sw=4:et:tw=120
// vim:ts=4:sw=4:et:tw=120
