$(function() {
    var dataReady = false;
    var $playersGrid = $("#players");
    var $metricsGrid = $('#metrics');
    var $teamsGrid = $('#teams');
    
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
            if (isNumber(row.value) && row.value > 0 && row.name != 'Number of Teams') {
                formula = formula + ' (' + row.name + ' * ' + row.value + ') +';
            }
        }
        if (formula.length > 0) {
            $('#formula').val(formula.substring(0, formula.length-1));
        } 
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
                
        $.ajax({type: 'POST', contentType: 'application/json', url: '/generate', data: $.toJSON(playerData), success: playerDataCallback, dataType: 'json'});
    });

    var playerDataCallback = function(data, textStatus, jqXHR) {
        console.log(data);
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
        
        createMetricsGrid();
        
        createGenderRadios(colNames);
        createAttributeCheckboxes(colNames);
        
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
        createAttributeCheckboxes(colNames);
        
        $('#gridBody').slideDown();
        $('#inputTypeBody').slideUp();
        dataReady = true;
        
        //testing
        $('#inputTypeBody').slideUp();
        $('#introductionBody').slideUp();
        $('#gridBody').slideUp();
        $('#metricsGridBody').slideDown();
    }
    
    //This interrupts the form submission and fires it voodoo which allows us to
    //add a callback meaning the page doesn't need to refresh 
    $('#formFileUpload').ajaxForm({
        success: fileUploadCallback,
        dataType: 'json',
        resetForm: true  
    });
    
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
    
    testGenerate();
    //manualTest();
});