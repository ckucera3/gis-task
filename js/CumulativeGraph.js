var app = app || {};

app.CumulativeGraph = (function() {

	var initialize = function (dom) {
		var model = {
			data: {}
		};
		model.base = dom;
		model.m = {
			width: window.innerWidth * 0.75,
			height: window.innerHeight * 0.75,
			graphWidth: parseInt(model.base.style("width")),
			graphHeight: parseInt(model.base.style("height")),
		};

		model.m.margins = {
			width: (0.1) * model.m.graphWidth,
			height: (0.1) * model.m.graphHeight,
			left: (0.125) * model.m.graphWidth,
			right: (0.05) * model.m.graphWidth,
			top: (0.05) * model.m.graphHeight,
			bottom: (0.1) * model.m.graphHeight

		}

		//create svg
		model.svg = model.base.append("svg")
		.attr("width", model.m.graphWidth)
		.attr("height", model.m.graphHeight)
		;

		//create group
		model.group = model.svg.append("g");
		model.barsGroup = model.svg.append("g");

		//create background rectangle
		model.bgRect = model.group.append("rect")
		.attr("width", model.m.graphWidth - (model.m.margins.left) - (model.m.margins.right))
		.attr("height", model.m.graphHeight - (model.m.margins.top) - (model.m.margins.bottom))
		.attr("x", model.m.margins.left)
		.attr("y", model.m.margins.top)
		.attr("fill", "white")
		.attr("stroke", "black")
		.attr("stroke-width", "2px")
		;

		//attach helper functions
		model.update = update;
		model.updateYear = updateYear;

		return model;
	};

	var updateYear = function(model, year) {
		model.m.barHeight = (parseInt(model.bgRect.attr("height")) / model.data.yearMap[year].length)/2;
		model.m.spacing = model.m.barHeight / 2;
		//data join
		model.bars = model.barsGroup.selectAll("rect").data(model.data.yearMap[year]);
		//enter
		model.barsEnter = model.bars.enter().append("rect")
		.attr("width", 0)
		.attr("height", model.m.barHeight)
		.attr("x", model.m.margins.left + 1)
		.attr("y", function(d) {
			return model.scales.y(d.key) + model.m.margins.top + model.m.spacing;
		})
		.attr("fill", "teal")
		.transition().duration(1000)
		.attr("width", function(d) {
			return model.scales.x(d.values) + 1;
		})
		.attr("stroke", "none")
		;

		//update
		model.barsUpdate = model.bars
		.attr("height", model.m.barHeight)
		.attr("x", model.m.margins.left + 1)
		.attr("y", function(d) {
			return model.scales.y(d.key) + model.m.margins.top + model.m.spacing;
		}).attr("fill", "teal")
		.transition().duration(1000)
		.attr("width", function(d) {
			return model.scales.x(d.values) + 1;
		})
		.attr("stroke", "none")
		;
	}

	var update = function (data) {
		model = this;
		model.data.orig = data;
		// treat data
		model.data.byYear = d3.nest()
		.key(function(d) {
			return d.Year;
		}).entries(data);

		var yearOriginMap = {};

		model.data.byYear.forEach(function(d) {
			var key = d.key;
			var values = d3.nest()
			.key(function(d) {
				return d["Origin"];
			}).rollup(function(v) {
				return d3.sum(v, function(d) {
					return d["Total Population"];
				});
			}).entries(d.values);
			yearOriginMap[key] = values;

		});

		//create accessory data arrays
		model.data.totals = [];
		Object.keys(yearOriginMap).forEach(function(key) {
			yearOriginMap[key].forEach(function(d) {
				model.data.totals.push(d.values);
			});
		});

		model.data.originCountries = Object.keys(d3.nest()
			.key(function(d) {
				return d["Origin"];
			}).rollup(function(v) {
				return "";
			}).map(model.data.orig));

		model.data.yearOriginMap = yearOriginMap;
		model.data.yearArray = Object.keys(yearOriginMap);
		model.data.yearMap = yearOriginMap;
		//dropdown menu
		model.dropdown = d3.select("#dropdown");
		model.options = model.dropdown
		.selectAll("option")
		.data(model.data.yearArray).enter()
		.append("xhtml:option").attr("value", function(d,i) {
			return d;
		}).text(function(d,i) {
			return d;
		})
		;

		createScalesAndAxes(model);
		updateYear(model, '2005');

	}

	var createScalesAndAxes = function(model) {

		var xScale, yScale, xAxis, xAxisG, yAxis, yAxisG, colors;
		//create x scale and xAxis
		xScale = d3.scale.linear()
		.domain(d3.extent(model.data.totals)).nice()
		.range([0, parseInt(model.bgRect.attr("width"))])
		;

		//x axis
		xAxis = d3.svg.axis()
		.orient("bottom")
		.scale(xScale)
		;

		xAxisG = model.group.append("g")
		.attr("class", "xaxis")
		.attr("transform", "translate(" + (model.m.margins.left) + " "
			+ (parseInt(model.bgRect.attr("height")) + model.m.margins.top) + ")")
		.call(xAxis);

		//create y scale and yAxis
		yScale = d3.scale.ordinal()
		.domain(model.data.originCountries.reverse())
		.rangeBands([0, (parseInt(model.bgRect.attr("height")))])
		;

		//y axis
		yAxis = d3.svg.axis()
		.orient("left")
		.scale(yScale)
		.tickFormat(function(d) {
			return d.split("(")[0];
		})
		;

		yAxisG = model.group.append("g")
		.attr("class", "yaxis")
		.attr("transform", "translate("
			+ (model.m.margins.left) + " " + (model.m.margins.top) + ")")
		.call(yAxis);

		//colors
		colors = d3.scale.category10();

		model.scales = {
			x: xScale,
			y: yScale,
			colors: colors
		};

		model.axes = {
			x: xAxis,
			xG: xAxisG,
			y: yAxis,
			yG: yAxisG
		};


	};

	return {
		initialize: initialize,
		update: update,
		updateYear: updateYear
	}

})();