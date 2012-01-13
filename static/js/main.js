$(function() {
    var dataReady = false;
    var $playersGrid = $("#players");
    var $metricsGrid = $('#metrics');
    var $teamsGrid = $('#teams');
    var $uploadError = $('#uploadReturnError');
    
    //Utility functions
    var isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    
    var getKeys = function(obj){
        var keys = [];
        for(var key in obj){
            keys.push(key);
        }
        return keys;
    };
    
    //Click events
    $('#gridHeader').click(function() {
        if (dataReady) {
            $('#gridBody').slideToggle();
        } else {
            var duration = 1500;
            var message = $('#dataNotReadyPlayer');
            message.fadeIn(duration, function() {
                message.fadeOut(duration, function() { });
            });
        }
    });
    
    $('#metricsGridHeader').click(function() {
        if (dataReady) {
            $('#metricsGridBody').slideToggle();
        } else {
            var duration = 1500;
            var message = $('#dataNotReadyMetrics');
            message.fadeIn(duration, function() {
                message.fadeOut(duration, function() { });
            });
        }
    });
    
    $('#createGridButton').click(function() {
        createManualGrids();
    });
    
    $('#generateFormula').click(function() {
        var data = $metricsGrid.getRowData();
        formula = '';
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (isNumber(row.value) && row.value != 0 && row.name != 'Number of Teams') {
                formula = formula + ' (' + row.name + ' * ' + row.value + ') +';
            }
        }
        if (formula.length > 0) {
            $('#formula').val(formula.substring(0, formula.length-1));
        } 
    });
    
    $('#contactMe').click(function() {
        $('#dialog-form').dialog('open');
    });
    
    $('#generateTeams').click(function() {
        var playerData = {};
        
        playerData.players = $playersGrid.getGridParam('data');
        
        playerData.columns = {};
        //playerData.formula = {};
        playerData.numTeams = 0;
        
        var metrics = $metricsGrid.getRowData();
        for (var i = 0; i < metrics.length; i++) {
            var metric = metrics[i];
            var name = metric.name
            if (name == 'Number of Teams') {
                playerData.numTeams = metric.value;
            } else {
                playerData.columns[name] = metric.value;
            }
        }
        
        playerData.genderColumn = $('input[name="selectedGender"]:checked').val();
        playerData.genderFormat = $('input[name="genderFormat"]:checked').val();
        
        playerData.balanceAttributes = []
        
        $.each($('input[name="selectedAttributes[]"]:checked'), function() {
            playerData.balanceAttributes.push($(this).val()); 
        });
        
        $('#generateReturnStatus').slideUp();
        $('#downloadTeams').slideUp();
               
        $.ajax({type: 'POST', contentType: 'application/json', url: '/generate', data: $.toJSON(playerData), success: playerDataCallback, dataType: 'json'});
    });

    var playerDataCallback = function(data, textStatus, jqXHR) {
        $returnStatus = $('#generateReturnStatus');
        if (data.status == 'failed') {
            $returnStatus.removeAttr('class')
                .attr('class', 'alert-message error')
                .html('<span><strong>Error! </strong>' + data.message + '</span>')
                .slideDown();    
        } else {
            $returnStatus.removeAttr('class')
                .attr('class', 'alert-message success')
                .html('<span><strong>Success!</strong> Your brand spanking new csv file is ready for download below!</span>')
                .slideDown();
            $('#downloadTeams').slideDown();
        }
    };
    
    var createColModel = function(width, colNames) {
        var colWidth = colNames.length > 0 ? width / colNames.length : 0;
        var colModel = []
        
        //iterate through the columns and add them to the model
        for(var i = 0; i< colNames.length; i++) {
            var key = colNames[i];
            var model = {name: key, index: key, editable:true, editrules: {required: true}, width: colWidth};
            colModel.push(model);
        }
        return colModel
    }
    
    var createMetricsGrid = function(playerCols) {
        var colNames = ['Column Name', 'Value'];
        var colModel = [{name: 'name', index: 'name', editable:false, editrules: {required: true}, width:320},
                    {name: 'value', index: 'value', editable:true, editrules: {required: true}, width:90}];
        
        //create the grid
        initGrid($metricsGrid, colNames, colModel, 410, 250, {add: false, del: false, search: false, refresh: false}, '#metricsPager');
        
        //populate it with the column names entered by the user
        $metricsGrid.clearGridData();
        for (var i = 0; i < playerCols.length ; i++) {
            var row = {};
            row.name = playerCols[i];
            row.value = 0;
            $metricsGrid.addRowData(i, row);
        }
        //add an extra row so the user can enter how many teams they want
        $metricsGrid.addRowData($metricsGrid.getDataIDs().length + 1, {index: 'numTeams', name: 'Number of Teams', value: 0});
        $metricsGrid.trigger('reloadGrid');
    }
    
    var createManualGrids = function() {
        var colNames = [];
        var width = 890;
        
        //get the column names
        $('#enteredColumns option').each(function(i, element) {
            var $column = $(element).val();      
            colNames.push($column);
        });
        
        //we do colModel serparately so we can work out the width first
        var colModel = createColModel(width, colNames);
        
        //make the players grid
        initGrid($playersGrid, colNames, colModel, 890, 500, {refresh: false}, '#pager')
        
        createMetricsGrid(colNames);
        
        createGenderRadios(colNames);
        //createAttributeCheckboxes(colNames);
        
        $('#gridBody').slideDown();
        $('#inputTypeBody').slideUp();
        dataReady = true;
    };   
    
    var createAttributeCheckboxes = function(colNames) {
        for (var i = 0; i < colNames.length; i++) {
            var column = colNames[i];
            $('#attributeSelection').append(
                $(document.createElement('input')).attr({
                    id: "attribute" + column,
                    name: 'selectedAttributes[]',
                    value: column,
                    type: 'checkbox'
                })
            )
            .append(
                  $(document.createElement('label')).attr({
                    'for': "attribute" + column,
                    'class': 'dataContainerRadioLabel'
                  })
                  .text(column)
            );
        }; 
    }
    
    var createGenderRadios = function(colNames) {
        for (var i = 0; i < colNames.length; i++) {
            var column = colNames[i];
            $('#genderColumnName').append(
                $(document.createElement('input')).attr({
                    id: "gender" + column,
                    name: 'selectedGender',
                    value: column,
                    type: 'radio',
                    'class': 'dataContainerRadio'
                })
            )
            .append(
                  $(document.createElement('label')).attr({
                    'for': "gender" + column,
                    'class': 'dataContainerRadioLabel'
                  })
                  .text(column)
            );
        }; 
    }
    
    var fileUploadCallback = function(players) {
        if (players.status == 'failed') {
            $uploadError.html('<span><strong>Error! </strong>' + players.message + '</span>')
                .slideDown(); 
        } else if (players.status == 'success') {
            $uploadError.slideUp();
            var colNames = getKeys(players[0]);
            var width = 890;
                    
            var colModel = createColModel(width, colNames);
            initGrid($playersGrid, colNames, colModel, 890, 500, {}, '#pager')
                   
            $playersGrid.clearGridData();
            for (var i = 0; i < players.length; i++) {
                $playersGrid.addRowData(i, players[i]);
            }
            $playersGrid.trigger('reloadGrid');
            
            createMetricsGrid(colNames);
            
            createGenderRadios(colNames);
            //createAttributeCheckboxes(colNames);
            
            $('#gridBody').slideDown();
            $('#inputTypeBody').slideUp();
            dataReady = true;
        }
    }
    
    //This interrupts the form submission and does voodoo which allows us to
    //add a callback meaning the page doesn't need to refresh 
    $('#formFileUpload').ajaxForm({
        success: fileUploadCallback,
        dataType: 'json',
        resetForm: true  
    });
    
    $('#formEmail').ajaxForm({
        resetForm: true  
    });
    
    (function() {
        var $email = $('#modalEmail');
        var $emailLabel = $('#modalEmailLabel');
        var $name = $('#modalName');
        var $nameLabel = $('#modalNameLabel');
        var $message = $('#modalMessage');
        var $messageLabel = $('#modalMessageLabel');
        var $validateMessage = $('#modalValidateMessage');
        
        
        var validateEmail = function() {    
           return checkRegexp($email.val(), /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
        }
        
        var validateName = function() {
            if (! $name.val().length > 0) {
                $nameLabel.css('color', 'red');
                return false;
            }
            return true;
        }
        
        var validateMessage = function() {
            if (! $message.val().length > 0) {
                $messageLabel.css('color', 'red');
                return false;
            }
            return true;
        }
        
        var checkRegexp = function( o, regexp, n ) {
            if ( !( regexp.test( o ) ) ) {
                $emailLabel.css('color', 'red');
                return false;
            }
            return true;
        }
        
        var resetModalValues = function() {
            $name.val('');
            $email.val('');
            $message.val('');
        }
        
        var resetModalLabels = function() {   
            var textColour = '#404040';
            $nameLabel.css('color', textColour);
            $emailLabel.css('color', textColour);
            $messageLabel.css('color', textColour);
            $validateMessage.css('color', textColour);
        }
        
        $( "#dialog-form" ).dialog({
            autoOpen: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Submit": function() {
                    resetModalLabels();
                    //this is a bit daft but without assigning to variables if any fail in the if then they wouldn't run the
                    //checks in the sequence following the failed one
                    var validEmail = validateEmail();
                    var validName = validateName();
                    var validMessage = validateMessage();
                    if (validEmail && validName && validMessage) {
                        $('#formEmail').submit();
                        $(this).dialog("close");
                    } else
                    {
                        $validateMessage.css('color', 'red');
                    }
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                resetModalValues();
                resetModalLabels();
            }
        });
    })();
    
    
    //Testing
    var manualTest = function() {
        var $columns = $('#enteredColumns');
        $columns.append($('<option></option>')
                                .text('Name')
                                .attr('value', 'Name')
        );
        $columns.append($('<option></option>')
                                .text('Cutting')
                                .attr('value', 'Cutting')
        );
        $columns.append($('<option></option>')
                                .text('Handling')
                                .attr('value', 'Handling')
        );
        $columns.append($('<option></option>')
                                .text('Experience')
                                .attr('value', 'Experience')
        );
        $('#createGridButton').click();
    }
    
    var testGenerate = function() {
        $.post('/test', {}, fileUploadCallback);
    };
});