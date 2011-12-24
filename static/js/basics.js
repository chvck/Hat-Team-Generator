$(function() {
    var $introBody = $('#introductionBody');
    var $inputBody = $('#inputTypeBody');
    
    $('#introNextStep').click(function() {
        $introBody.slideUp();
        $inputBody.slideDown();
    });
        
    $('#playersNextStep').click(function() {
        $('#gridBody').slideUp();
        $('#metricsGridBody').slideDown();
    });
    
    $('#inputTypeHeader').click(function() {
        $inputBody.slideToggle();
    });
    
    $('#introductionHeader').click(function() {
        $introBody.slideToggle();
    });
    
    $('input[name="inputType"]').change(function(){
        $('#uploadOptions').slideToggle();
        $('#manualOptions').slideToggle();
    });
    
    $('#addColumnButton').click(function() {
        var $column = $('#textColumnName');
        var $columnVal = $column.val();
        if ($columnVal.length > 0) {
            $('#enteredColumns').append($('<option></option>')
                                .text($columnVal)
                                .attr('value', $columnVal)
            );
        }
        $column.val('');
        $column.focus();
    });
    
    $("#textColumnName").keyup(function(event){
        if(event.keyCode == 13){
            $("#addColumnButton").click();
        }
    });
    
    $('#removeColumnButton').click(function() {
        $('#enteredColumns :selected').each(function(i, element) {
            $(element).remove();    
        });
    });
    
    $('#genders').change(function() {
        $('#genderOptions').slideToggle();
    });
});