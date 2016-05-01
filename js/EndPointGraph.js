var app = app || {};

app.EndPointGraph = (function() {

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

		var yearObject = model.data.yearMap[year];
		topFiveCountries = ["Germany", "Netherlands", "United Kingdom", "Sweden", "Denmark"];
		model.m.barHeight = (parseInt(model.bgRect.attr("height")) / yearObject.length) / 2;
		model.m.spacing = model.m.barHeight / 2;
		model.m.interBarHeight = model.m.barHeight / 5;
		model.m.interBarSpacing = model.m.barHeight / 4;
		//data join
		model.barGs = model.barsGroup.selectAll(".bar-group").data(yearObject);
		//model.barGs.data([]);
		//model.barGs.data(yearObject);
		// console.log(yearObject);
		// console.log(model.barGs.data());
		//enter
		model.barGsEnter = model.barGs.enter().append("g")
		.attr("class", "bar-group")
		;

		//data join
		topFiveCountries.forEach(function(d, i) {
			classString = ".bar-" + i;
			model.bars[i] = model.barsGroup.selectAll(classString).data(yearObject);
		});

		//update
		topFiveCountries.forEach(function(d, i) {
			classString = ".bar-" + i;
			model.barsUpdate[i] = model.bars[i]
			.attr("height", model.m.interBarHeight)
			.attr("x", model.m.margins.left + 1)
			.attr("y", function(d) {
				return model.scales.y(d.key) + model.m.margins.top + model.m.interBarSpacing * i;
			})
			.attr("fill", model.scales.colors(i))
			.transition().duration(1000)
			.attr("width", function(d) {
				//console.log(i + ": " + d.values[topFiveCountries[i]]);
				var val = d.values[topFiveCountries[i]];
				if (!val) {
					val = 0;
				}
				//console.log(val);
				return model.scales.x(val) + 1;
			})
			.attr("stroke", "none")
			;
		});

		//enter
		topFiveCountries.forEach(function(d, i) {
			classString = "bar-" + i;
			model.barsEnter[i] = model.bars[i].enter()
			.append("rect").attr("class", classString)
			.attr("height", model.m.interBarHeight)
			.attr("x", model.m.margins.left + 1)
			.attr("y", function(d) {
				return model.scales.y(d.key) + model.m.margins.top + model.m.interBarSpacing * i;
			})
			.attr("fill", model.scales.colors(i))
			.transition().duration(1000)
			.attr("width", function(d) {
				//console.log(i + ": " + d.values[topFiveCountries[i]]);
				var val = d.values[topFiveCountries[i]];
				if (!val) {
					val = 0;
				}
				return model.scales.x(val) + 1;
			})
			.attr("stroke", "none")
			;
		});

		//remove
		topFiveCountries.forEach(function(d, i) {
			model.bars[i].exit().remove();
		});

	}

	var update = function (data) {
		model = this;
		model.data.orig = data;
		model.barsEnter = [];
		model.bars = [];
		model.barsUpdate = [];
		model.barsEnter = [];
		model.barsExit = [];
		// treat data
		model.data.byYear = d3.nest()
		.key(function(d) {
			return d.Year;
		}).entries(data);

		model.data.originCountries = Object.keys(d3.nest()
			.key(function(d) {
				return d["Origin"];
			}).rollup(function(v) {
				return "";
			}).map(model.data.orig));

		model.data.totals = [];

		// create nests of Origin.Endpoint.Totals
		var originEndpointTotals = d3.nest()
		.key(function(d) {
			return d["Year"];
		})
		.key(function(d) {
			return d["Origin"];
		}).key(function(d) {
			return d["Country / territory of asylum/residence"];
		}).rollup(function(v) {
			return d3.sum(v, function(d) {

				var num = Number(d["Total Population"]);
				if (isNaN(num)) {
					num = 0;
				} else {
					model.data.totals.push(num);
				}
				return num;
			})
		}).entries(data);

		var originEndpointTotalMaps = [];
		var yearMap = {};
		var originArray = [];
		originEndpointTotals.forEach(function(d) {
			originArray = [];
			d.values.forEach(function(d) {
				var obj = {};
				obj.key = d.key;
				obj.values = {};
				//console.log(d);
				obj.values[d.key] = d.values;
				d.values.forEach(function(d) {
					obj.values[d.key] = d.values;
				});
				originArray.push(obj);
			});
			yearMap[d.key] = originArray;

		});
		model.data.yearMap = yearMap;

		console.log(model.data.totals);

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
		initialize: initialize
	}

})();