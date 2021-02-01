var ctx = {
    w: 1340,//1200,
    h: 850,
    vmargin: 2,
    hmargin: 4,
    timeParser: d3.timeParse("%m/%d/%Y"),
    tileDim: 20,
    detTileDim: 20,
    initTileDim: 25,
    buttonV: 10,
    fontSize: 11,
    legendVSpacing: 20,
    histoW: 880,
    histoH: 250,
    histoAxisMargin: 20,
    histoSmallestHeight: 1,
    categories: ["social_networking","reading_and_reference","other","productivity","health_and_fitness","entertainment"],
    columns: ["total","social_networking","reading_and_reference","other","productivity","health_and_fitness","entertainment"],
    columnNames: ["Total Screen Time","Social Networking","Reading and Reference","Other","Productivity","Health and Fitness","Entertainment"],
    colors: ["#377eb8","#ff7f00","#e41a1c","#FFD300","#4daf4a","#EA5F94","#984ea3"],
    nonSelectedColor: "#F0F0F0", //"WhiteSmoke", //"LightGray",
    hiddenTitleColor: "LightGray",
    hoveredColor: "DarkGray",
    weekDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    yogaMode: false,
    buttonX: 1220,
    buttonY: 730,
    monthView: true,
    detailedView: true,
    detViewCreated: false,
    transitioning: false,
    selectedCols: [],
    anim_duration: 1000,
    zoom_anim_duration: 500
};

var createViz = function(){
    d3.select("body")
      .on("keydown", function(event,d){handleKeyEvent(event);});
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg").attr("id","mainSVG");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var generateData = function(data,yogaValue) {
    let ret = {dates: [], week_dates: [], rawCategories: {}, avgCategories: {}, avgCategoriesTotal: {}};

    //initialize each entry of ret
    for (cat of ctx.columns) {
      ret.rawCategories[cat] = [];
      ret.avgCategories[cat] = [];
      ret.avgCategoriesTotal[cat] = 0;
      for (w of ctx.weekDays) {
        ret.avgCategories[cat].push(0);
      }
    }

    for (row of data) {
      if (row.yoga == yogaValue) {
        ret.dates.push(row.date);
        ret.week_dates.push(row.week_day);
        for (cat of ctx.columns) {
          ret.rawCategories[cat].push(parseInt(row[cat]));
        }
      }
    }

    //filling the avg entries
    let weekDaysNums = {};
    for (w of ctx.weekDays) {
      weekDaysNums[w] = {num: 0, indices: []};
    }
    for (const [index, day] of ret.week_dates.entries()) {
      weekDaysNums[day].num += 1;
      weekDaysNums[day].indices.push(index);
    }

    for (const [weekIndex,w] of ctx.weekDays.entries()) {
      for (row_idx of weekDaysNums[w].indices) {
        for (cat of ctx.columns) {
          ret.avgCategories[cat][weekIndex] += ret.rawCategories[cat][row_idx];
        }
      }
      for (cat of ctx.columns) {
        ret.avgCategories[cat][weekIndex] /= weekDaysNums[w].num;
      }
    }

    for (cat of ctx.columns) {
        for (i = 0; i < 7; i++) {
          ret.avgCategoriesTotal[cat] += ret.avgCategories[cat][i];
        }
        ret.avgCategoriesTotal[cat] /= 7;
    }

    return ret;
}

var transformData = function(data){
    let res = {before:{}, after:{}, dif: {}};
    // each of before/after contains: dates (array of dates) week_dates (array of week days), rawCategories (a dict consisting of each category and its values),
    //                                avgCategories (a dict of average values for each category in a list starting from M...Sunday)
    //                                avgCategoriesTotal (a dict of average values for each category over the weeks)
    res.before = generateData(data,0);
    res.after = generateData(data,1);

    for (col of ctx.columns) {
       let diff = 100.0*(res.after.avgCategoriesTotal[col]-res.before.avgCategoriesTotal[col])/res.before.avgCategoriesTotal[col];
       res.dif[col] = diff;
    }

    return res;
};

var loadData = function(svgEl){
    d3.csv("screen-time.csv").then(function(data){
        var screenData = transformData(data);
        ctx.screenData = screenData;
        //console.log(screenData);
        ctx.tileDim = ctx.initTileDim;
        createMonthView(screenData, svgEl); // written in month-view.js
    }).catch(function(error){console.log(error)});
};

/* Input events */
var handleKeyEvent = function(e){
    if (e.keyCode === 84){
        // hitting t on the keyboard switches view
        switchView(); // function in transitions.js
    }
    else if (e.keyCode === 82) {
        // hitting r on the keyboard resets selection
        ctx.selectedCols = []; updateSelectedCols(); // function in detailed-view.js
    }
    else if (e.keyCode == 89) {
      d3.select("#yogaButton").select("input").property("checked",!ctx.yogaMode);
      toggleYoga(); // function in transitions.js
    }
};
