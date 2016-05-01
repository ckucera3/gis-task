var app = app || {};

app.YearDropdown = (function() {

	var initialize = function (dom, data, charts) {
		var model = {
			data: data,
			charts: charts
		};

		model.dropdown = dom;


		var years = d3.nest()
		.key(function(d) {
			return d["Year"];
		}).rollup(function(v) {
			return "";
		}).entries(data)
		.map(function(d) {
			return d.key;
		}).reverse()
		;

		//dropdown menu
		model.dropdown = d3.select("#dropdown");
		model.options = model.dropdown
		.selectAll("option")
		.data(years).enter()
		.append("xhtml:option").attr("value", function(d,i) {
			return d;
		}).text(function(d,i) {
			return d;
		});

		model.dropdown.on('change', function() {
			var value = d3.select(this).property('value');

			charts.forEach(function(chart) {
				chart.updateYear(chart, value);
			});
		});


	};

	return {
		initialize: initialize
	}

})();