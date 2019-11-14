var pie_bar_chart;
var generation_config;
var price_config;
var temperature_config;
var pie_config;
var total;

//configuration for the energy chart
generation_config = {
    chart: {
            type: 'areaspline',
            marginLeft: 20,
            spacingTop: 10,
            spacingBottom: 10,
            backgroundColor: "transparent"      
    },
    legend:{
        enabled: false
    },
    title: {
        style: {
            fontWeight: 'bold'
        },
        align: "left",
        text: 'Generation (MW)',
        fontSize: 18,
    },
    tooltip: {
        crosshairs: [{
          width: 1,
          color: 'red',
          zIndex: 3
        }],
        shared: true,
        formatter: function () {
            return Highcharts.dateFormat('%e %b. %I:%M %P',
            new Date(this.points[0].x)) + ' Total '+ this.points[0].total + ' MW'
        },
        positioner: function () {
            return {
                x: this.chart.chartWidth - this.label.width,
                y: 10
            };
        },
        borderWidth: 0,
        backgroundColor: "transparent",
        shadow: false,
        style: {
            fontSize: '12px'
        },
        snap: 100,
        enabled: false
    },
    plot: {
        tooltip:{
            visible: false
        },
        aspect: "spline",
        stacked: true
    },
    plotarea: {
        margin: "dynamic"
    },
    xAxis: {
        type: 'datetime',
        minorTickInterval: 1000*60*30,
        dateTimeLabelFormats: {
            month: '%b \'%y'
        },
        crosshair: {
            color: '#CA5131',
            width: 1,
            zIndex: 5
        },
        events: {
            setExtremes: syncExtremes
        }
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            formatter: function (){
                return this.value;
            },
            align: 'left',
            reserveSpace: false,
            x: 5,
            y: -3
        },
        tickInterval: 1000,
        showLastLabel: false,
        min: -1000
    },
    plotOptions: {
        series: {
            stacking: "normal",
            states: {
                inactive: {
                    opacity: 1
                },
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

//configuration for the price chart
price_config = {
    chart: {
            type: 'line',
            marginLeft: 20,
            spacingTop: 10,
            spacingBottom: 10    
    },
    legend:{
        enabled: false
    },
    title: {
        style: {
            fontWeight: 'bold'
        },
        align: "left",
        text: 'Price ($/MWh)',
        fontSize: 18,
    },
    tooltip: {
        crosshairs: [{
          width: 1,
          color: 'red',
          zIndex: 3
        }],

        enabled: false

      },
    xAxis: {
        visible: false
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            align: 'left',
            reserveSpace: false,
        },
    },
    plotOptions: {
        line: {
            step: 'left',
            color: "red",
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

//configuration for the temperature line chart
temperature_config = {
    chart: {
            type: "line",
            marginLeft: 20,
            spacingTop: 10,
            spacingBottom: 10        
    },
    title: {
        style: {
            fontWeight: 'bold'
        },
        align: "left",
        text: 'Temperature (\u2109)',
        fontSize: 18,
    },
    legend:{
        enabled: false
    },
    tooltip: {
        crosshairs: [{
          width: 1,
          color: 'red',
          zIndex: 3
        }],

        enabled: false
      },
    xAxis: {
        visible: false
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            align: 'left',
            reserveSpace: false,
        },
    },
    plotOptions: {
        line: {
            color: "red",
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
}

pie_config = {
    chart: {
        renderTo: 'pieContainer',
        type: 'pie',
        backgroundColor: 'transparent',
        animation: false,
    },
    plotOptions: {
        pie: {
            innerSize: '50%',
            size: '75%',
            dataLabels: {
                enabled: false
            }
        },
        series: {
            animation: false
        }
    },
    title: {
        align: 'center',
        verticalAlign: 'middle',
        text: '',
        style: {
            fontSize: '20px'
        }
    },
    series: [{
        name: 'Percentage',
        colorByPoint: true,
        data: []
    }]
}
var colorsMap = {
    'black_coal': '#000000', 
    'distillate': '#FF4836', 
    'gas_ccgt': '#FFC420',
    'hydro': '#0084AD',
    'wind': '#21A100',
    'exports': '#EEC9FF',
    'pumps': '#9FE8FF'
};

var globalEnergyData = {
  name: [],
  data: []
};

// function to do deep-copy on the global data structure
function updateEnergyData(data) {
    data = data.filter(function(elm) {
        return (elm.name !== 'pumps' & elm.name !== 'exports')
    })
    globalEnergyData.data = [];
    for (var idx = 0; idx < data[0]['data'].length; idx ++) {
        var energyBreakup = data.map(elm => {return elm['data'][idx]});
        globalEnergyData['data'].push(energyBreakup);
      }
      globalEnergyData['name'] = data.map(elm => elm['name']);
}

function renderPieChart(nodeId) {
    var pieData = globalEnergyData['name'].map(function(elm, idx) {
        if (globalEnergyData['name'] !== 'pumps' & globalEnergyData['name'] !== 'exports') {
            return {
                name: elm.split('.')[elm.split('.').length - 1],
                y: globalEnergyData['data'][nodeId][idx],
                color: colorsMap[elm.split('.')[elm.split('.').length - 1]]
            }
        }
    });
    pie_config.series[0].data = pieData;
    total = 0;
    for (var i = 0; i < pie_config.series[0].data.length; i++) {
        total = total + pie_config.series[0].data[i].y
    }
    pie_config.title.text = Math.round(total) + ' MW';
    pie_bar_chart = Highcharts.chart(pie_config)
  }
// this function is responsible for plotting the energy on
// successfully loading the JSON data
// It also plots the pie chart for nodeId=0
function onSuccessCb(jsonData) {
    var energyData = jsonData.filter(function(elm) {
        if (elm.fuel_tech !== 'rooftop_solar'){
            return elm['type'] === 'power';
        };
    }).map(function(elm) {
        var energyVals = new Array();
        if (elm.fuel_tech === 'pumps' || elm.fuel_tech === 'exports') {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]*(-1));
            };
        } else {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]);
            };
        }
        return {
            data: energyVals,
            name: elm.fuel_tech,
            pointStart: (elm.history.start + 5*60) * 1000,
            pointInterval: 1000 * 60 * 30,
            color: colorsMap[elm.fuel_tech],
            fillOpacity: 1,
            tooltip: {
                valueSuffix: ' ' + elm.units
            }
        };
    });
    updateEnergyData(energyData.reverse());

    var priceData = jsonData.filter(function(elm) {
        return elm['type'] === 'price';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id']
        };
    });
    var tempData = jsonData.filter(function(elm) {
        return elm['type'] === 'temperature';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id']
        };
    });

    generation_config.series = energyData;
    price_config.series = priceData;
    temperature_config.series = tempData;

    var chartDiv1 = document.createElement('div');
    chartDiv1.className = 'lgChart';
    document.getElementById('sharedGrid').appendChild(chartDiv1);
    Highcharts.chart(chartDiv1, generation_config);

    var chartDiv2 = document.createElement('div');
    chartDiv2.className = 'medChart';
    document.getElementById('sharedGrid').appendChild(chartDiv2);
    Highcharts.chart(chartDiv2, price_config);

    var chartDiv3 = document.createElement('div');
    chartDiv3.className = 'smChart';
    document.getElementById('sharedGrid').appendChild(chartDiv3);
    Highcharts.chart(chartDiv3, temperature_config);

    renderPieChart(0)
    
}

//Synchronizes charts
['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
    document.getElementById('sharedGrid').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event,
                idx;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                // Find coordinates within the chart
                event = chart.pointer.normalize(e);
                // Get the hovered point
                point = chart.series[0].searchPoint(event, true);
                idx = chart.series[0].data.indexOf( point );

                if (point) {
                    point.highlight(e);
                    renderPieChart(idx); //Added to also synchronize the pie chart
                    updateLegend(idx);
                }
            }
        }
    );
});

['mouseleave'].forEach(function (eventType) {
    document.getElementById('sharedGrid').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event;
            
                for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                    chart = Highcharts.charts[i];
                    event = chart.pointer.normalize(e);
                    point = chart.series[0].searchPoint(event, true);
                    
                    if (point) {
                        point.onMouseOut(); 
                        chart.tooltip.hide(point);
                        chart.xAxis[0].hideCrosshair(); 
                    }
                }
            }
    )
});

/**
* Highlight a point by showing tooltip, setting hover state and draw crosshair
*/
Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh(this); // Show the tooltip
    this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
    this.series.chart.yAxis[0].drawCrosshair(event, this);
};


/**
* Synchronize zooming through the setExtremes event handler.
*/
function syncExtremes(e) {
    var thisChart = this.chart;

if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
    Highcharts.each(Highcharts.charts, function (chart) {
        if (chart !== thisChart) {
            if (chart.xAxis[0].setExtremes) { // It is null while updating
                chart.xAxis[0].setExtremes(
                    e.min,
                    e.max,
                    undefined,
                    false,
                    { trigger: 'syncExtremes' }
                );
            }
        }
    });
    }
}

function updateLegend(idx) {
    document.getElementById('windPower').innerHTML = (globalEnergyData.data[idx][0]).toFixed(2); 
    document.getElementById('hydroPower').innerHTML = (globalEnergyData.data[idx][1]).toFixed(2); 
    document.getElementById('gasPower').innerHTML = (globalEnergyData.data[idx][2]).toFixed(2); 
    document.getElementById('distPower').innerHTML = (globalEnergyData.data[idx][3]).toFixed(2); 
    document.getElementById('coalPower').innerHTML = (globalEnergyData.data[idx][4]).toFixed(2); 

    document.getElementById('windContr').innerHTML = (globalEnergyData.data[idx][0]/total*100).toFixed(2)+"%"; 
    document.getElementById('hydroContr').innerHTML = (globalEnergyData.data[idx][1]/total*100).toFixed(2)+"%"; 
    document.getElementById('gasContr').innerHTML = (globalEnergyData.data[idx][2]/total*100).toFixed(2)+"%"; 
    document.getElementById('distContr').innerHTML = (globalEnergyData.data[idx][3]/total*100).toFixed(2)+"%"; 
    document.getElementById('coalContr').innerHTML = (globalEnergyData.data[idx][4]/total*100).toFixed(2)+"%"; 
    
}

/* Add this to the xAxis attribute of each chart. */
events: {
        setExtremes: syncExtremes
    }
// Utility function to fetch any file from the server
function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200 || httpRequest.status === 0) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
}

// Triggers on click on id 'makeBar' to update the pie chart into a bar chart
document.getElementById('makeBar').addEventListener('click', function() {
    pie_bar_chart.update({
        chart: {
            type: 'bar'
        }
    });
})

// Triggers on click on id 'makeBar' to update the bar chart into a pie chart
document.getElementById('makePie').addEventListener('click', function() {
    pie_bar_chart.update({
        chart: {
            type: 'pie'
        }
    });
    renderPieChart(0);
})

// The entrypoint of the script execution
function doMain() {
    fetchJSONFile('assets/springfield_converted_json.js', onSuccessCb);
}

//Do main
document.onload = doMain();
