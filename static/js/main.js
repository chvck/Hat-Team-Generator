$(function() {
    var dataReady = false;
    var $playersGrid = $("#players");
    var $metricsGrid = $('#metrics');
    
    $('#introNextStep').click(function() {
        $('#introductionBody').slideUp();
        $('#inputTypeBody').slideDown();
    });
        
    $('#playersNextStep').click(function() {
        $('#gridBody').slideUp();
        $('#metricsGridBody').slideDown();
    });
    
    $('#inputTypeHeader').click(function() {
        $('#inputTypeBody').slideToggle();
    });
    
    $('#introductionHeader').click(function() {
        $('#introductionBody').slideToggle();
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
    
    $('#genders').change(function() {
        $('#genderOptions').slideToggle();
    });
       
    $('#createGridButton').click(function() {
        createDataGrids();
    });
    
    var test = function() {
        $('#enteredColumns').append($('<option></option>')
                                .text('Name')
                                .attr('value', 'Name')
        );
        $('#enteredColumns').append($('<option></option>')
                                .text('Cutting')
                                .attr('value', 'Cutting')
        );
        $('#enteredColumns').append($('<option></option>')
                                .text('Handling')
                                .attr('value', 'Handling')
        );
        $('#enteredColumns').append($('<option></option>')
                                .text('Experience')
                                .attr('value', 'Experience')
        );
        $('#createGridButton').click();
    }
    
    $('#generateFormula').click(function() {
        var data = $metricsGrid.getRowData();
        formula = '';
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (isNumber(row.value) && row.value > 0 && row.name != 'Number of Teams' && row.name != 'Players per Team') {
                formula = formula + ' (' + row.name + ' * ' + row.value + ') +';
            }
        }
        if (formula.length > 0) {
            $('#formula').val(formula.substring(0, formula.length-1));
        } 
    });
    
    $('#generateTeams').click(function() {
        var playerData = {};
        
        //TODO: This only brings back the present page of jqgrid
        playerData.players = $playersGrid.getGridParam('data');
        
        playerData.columns = {};
        //playerData.formula = {};
        playerData.numTeams = 0;
        playerData.numPlayersTeam = 0;
        
        var metrics = $metricsGrid.getRowData();
        for (var i = 0; i < metrics.length; i++) {
            var metric = metrics[i];
            var name = metric.name
            if (name == 'Number of Teams') {
                playerData.numTeams = metric.value;
            } else if (name == 'Players per Team') {
                playerData.numPlayersTeam = metric.value
            } else {
                playerData.columns[name] = metric.value;
            }
        }
        
        $.ajax({type: 'POST', contentType: 'application/json', url: '/generate', data: $.toJSON(playerData), success: playerDataCallback, dataType: 'json'});
    });

    var playerDataCallback = function(data, textStatus, jqXHR) {
        console.log(data);
        console.log(textStatus);
    }

    var isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    
    var createColModel = function(width, colNames) {
        var colWidth = colNames.length > 0 ? width / colNames.length : 0;
        var colModel = []
        
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
        
        initGrid($metricsGrid, colNames, colModel, 410, 250, {add: false, del: false, search: false, refresh: false}, '#metricsPager');
        
        $metricsGrid.clearGridData();
        for (var i = 0; i < playerCols.length ; i++) {
            var row = {};
            row.name = playerCols[i];
            row.value = 0;
            $metricsGrid.addRowData(i, row);
        }
        var i = $metricsGrid.getDataIDs().length + 1;
        $metricsGrid.addRowData(i, {index: 'numTeams', name: 'Number of Teams', value: 0});
        i++;
        $metricsGrid.addRowData(i, {index: 'numPlayersTeam', name: 'Players per Team', value: 0})
        $metricsGrid.trigger('reloadGrid');
    }
    
    var createDataGrids = function() {
        var colNames = [];
        var width = 890;
        
        //sort the column names
        $('#enteredColumns option').each(function(i, element) {
            var $column = $(element).val();      
            colNames.push($column);
        });
        
        //we do colModel serparately so we can work out the width first
        //TODO: make this not shit and 1 loop no2 2
        var colModel = createColModel(width, colNames);
        
        initGrid($playersGrid, colNames, colModel, 890, 500, {refresh: false}, '#pager')
        
        createMetricsGrid();
        
        $('#gridBody').slideDown();
        $('#inputTypeBody').slideUp();
        dataReady = true;
    };   
    
    var updateGridCallback = function(data) {
        
    };
    
    var getKeys = function(obj){
        var keys = [];
        for(var key in obj){
            keys.push(key);
        }
        return keys;
    };
    
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
        
        $('#gridBody').slideDown();
        $('#inputTypeBody').slideUp();
        dataReady = true;
        
        //testing
        $('#generateTeams').click();
        $('#inputTypeBody').slideUp();
        $('#introductionBody').slideUp();
        $('#gridBody').slideUp();
        $('#metricsGridBody').slideDown();
    }
    
    $('#formFileUpload').ajaxForm({
        success: fileUploadCallback,
        dataType: 'json',
        resetForm: true  
    });
    
    var testGenerate = (function() {
        $.post('/upload', {}, fileUploadCallback);
    }());
    
    //test();
});