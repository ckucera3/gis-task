var app = app || {};

// import data

d3.csv('./data/unhcr_persons_of_concern.csv', function(data) {
	start(data);
});

function start (data) {
	//select DOM element base
	base1 = d3.select("#main");
	base2 = d3.select("#main2");
	//initialize the first chart
	endpointChart = app.EndPointGraph.initialize(base2);
	endpointChart.update(data);
	cumulativeChart = app.CumulativeGraph.initialize(base1);
	cumulativeChart.update(data);
	dropdown = app.YearDropdown.initialize(d3.select("#dropdown"),
	 data, [endpointChart, cumulativeChart]);
}
