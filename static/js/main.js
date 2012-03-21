$(function () {
    var dataReady = false
        , $playersGrid = $("#players")
        , $metricsGrid = $('#metrics')
        , $teamsGrid = $('#teams')
        , $uploadError = $('#uploadReturnError');
    
    //Utility functions
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    
    function getKeys(obj) {
        var keys = []
            , key;
            
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }
    
    //Click events
    $('#downloadExample').click(function () {
        $('#formDownloadExample').submit();
    });
    
    $('#gridHeader').click(function () {
        if (dataReady) {
            $('#gridBody').slideToggle();
        } else {
            var duration = 1500
                , message = $('#dataNotReadyPlayer');
            
            message.fadeIn(duration, function () {
                message.fadeOut(duration, function () { });
            });
        }
    });
    
    $('#metricsGridHeader').click(function () {
        if (dataReady) {
            $('#metricsGridBody').slideToggle();
        } else {
            var duration = 1500
            , message = $('#dataNotReadyMetrics');
            message.fadeIn(duration, function () {
                message.fadeOut(duration, function () { });
            });
        }
    });
    
    $('#createGridButton').click(function () {
        createManualGrids();
    });
    
    $('#generateFormula').click(function () {
        var rows = $metricsGrid.getRowData()
            , formula = '';
            
        $.each(rows, function (i, row) {
            if (isNumber(row.value) && row.value !== 0 && row.name !== 'Number of Teams') {
                formula = formula + ' (' + row.name + ' * ' + row.value + ') +';
            }
        });
        
        if (formula.length > 0) {
            $('#formula').val(formula.substring(0, formula.length - 1));
        } 
    });
    
    $('#generateTeams').click(function () {
        var playerData = {}
            , rows = $metricsGrid.getRowData();
        
        playerData.players = $playersGrid.getGridParam('data');
        
        playerData.columns = {};
        playerData.numTeams = 0;
        
        $.each(rows, function (i, row) {
            var name = row.name
                , value = row.value;
            
            if (name === 'Number of Teams') {
                playerData.numTeams = value;
            } else {
                playerData.columns[name] = value;
            }
        });
        
        playerData.genderColumn = $('input[name="selectedGender"]:checked').val();
        playerData.genderFormat = $('input[name="genderFormat"]:checked').val();
        
        playerData.balanceAttributes = [];
        
        $.each($('input[name="selectedAttributes[]"]:checked'), function () {
            playerData.balanceAttributes.push($(this).val()); 
        });
        
        $('#generateReturnStatus').slideUp();
        $('#downloadTeams').slideUp();
               
        $.ajax({type: 'POST', contentType: 'application/json', url: '/generate', data: $.toJSON(playerData), success: playerDataCallback, dataType: 'json'});
    });

    function playerDataCallback(data, textStatus, jqXHR) {
        $returnStatus = $('#generateReturnStatus');
        if (data.status === 'failed') {
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
    }
    
    function createColModel(width, colNames) {
        var colWidth = colNames.length > 0 ? width / colNames.length : 0
            , colModel = [];
        
        //iterate through the columns and add them to the model
        $.each(colNames, function (i, colName) {
            var model = {name: colName, index: colName, editable: true, editrules: {required: true}, width: colWidth};
            colModel.push(model);
        });
        return colModel;
    }
    
    function createMetricsGrid(playerCols) {
        var colNames = ['Column Name', 'Value']
            , colModel = [{name: 'name', index: 'name', editable: false, editrules: {required: true}, width: 320},
                    {name: 'value', index: 'value', editable: true, editrules: {required: true}, width: 90}];
        
        //create the grid
        initGrid($metricsGrid, colNames, colModel, 410, 250, {add: false, del: false, search: false, refresh: false}, '#metricsPager');
        
        //populate it with the column names entered by the user
        $metricsGrid.clearGridData();
        $.each(playerCols, function (i, playerCol) {
            $metricsGrid.addRowData(i, {name: playerCol, value: 0});
        });
        
        //add an extra row so the user can enter how many teams they want
        $metricsGrid.addRowData($metricsGrid.getDataIDs().length + 1, {index: 'numTeams', name: 'Number of Teams', value: 0});
        $metricsGrid.trigger('reloadGrid');
    }
    
    function createManualGrids() {
        var colNames = []
            , width = 890;
        
        //get the column names
        $('#enteredColumns option').each(function (i, element) {
            colNames.push($(element).val());
        });
                
        //we do colModel serparately so we can work out the width first
        var colModel = createColModel(width, colNames);
                
        resetGrid($playersGrid);
        //make the players grid
        initGrid($playersGrid, colNames, colModel, 890, 500, {refresh: false}, '#pager');
        
        createMetricsGrid(colNames);
        
        createGenderRadios(colNames);
        //createAttributeCheckboxes(colNames);
        
        $('#gridBody').slideDown();
        $('#inputTypeBody').slideUp();
        dataReady = true;
    }
    
    function createAttributeCheckboxes(colNames) {
        $.each(colNames, function (i, column) {
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
        }); 
    }
    
    function createGenderRadios(colNames) {
        $.each(colNames, function (i, column) {
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
        });
    }
    
    function fileUploadCallback(players) {
        if (players.status === 'failed') {
            $uploadError.html('<span><strong>Error! </strong>' + players.message + '</span>')
                .slideDown(); 
        } else if (players.status === 'success') {
            $uploadError.slideUp();
            var colNames = getKeys(players[0])
                , width = 890;
                    
            var colModel = createColModel(width, colNames);
            resetGrid($playersGrid);
            initGrid($playersGrid, colNames, colModel, 890, 500, {}, '#pager');
                   
            $playersGrid.clearGridData();
            $.each(players, function (i, player) {
                $playersGrid.addRowData(i, player);
            });
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
    
    //Testing
    function manualTest() {
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
    
    function testGenerate() {
        $.post('/test', {}, fileUploadCallback);
    }
});