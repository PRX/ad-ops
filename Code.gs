function test () {
  //reveal is 149, the moth is 24, criminal is 18, nightvale is 126
  //runQuery(['United States', 1]);
  //queryEachCountry();
  //var episodes = getPodcastEpisodes(126);
  //var sortedList = sortPodcasts(18, episodes);
  //buildSQLQuery(18, episodes, 'United States');
  //getSelectedCell();
  //showAdStructure(59);
}

function tinyBoxing (boxArray, spreadsheet, page) {
  var sheet = spreadsheet.getSheets()[page];
  
  for(var i = 0; i < boxArray.length; i++) {
    var cell = sheet.getRange(boxArray[i]);

    cell.setBorder(true, true, true, true, true, true);
  }
}

function largeBoxing (boxArray, spreadsheet, page) {
  var sheet = spreadsheet.getSheets()[page];
  
  for(var i = 0; i < boxArray.length; i++) {
    var cell = sheet.getRange(boxArray[i]);

    cell.setBorder(true, true, true, true, false, false);
  }
}


function getSelectedCell () {
var selection = SpreadsheetApp.getActiveSpreadsheet().getSelection();
// Returns the current highlighted cell in the one of the active ranges.
var currentCell = selection.getCurrentCell();
  Logger.log (currentCell.getValue());
   return currentCell.getValue();
}

function getTitle(podcastId) {
    var url = 'http://feeder.prx.org/api/v1/podcasts/'+podcastId
    var res = UrlFetchApp.fetch(url).getContentText();
    var title = JSON.parse(res).title;

    return title;
  }

function queryEachCountry(){
    var podcastId = getSelectedCell()
    if(typeof podcastId != 'number') {
      var ui = SpreadsheetApp.getUi();
      ui.alert("You haven't selected an ID cell!")
      return null;
    }
  
  var countries = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getRange("A15:B19").getDisplayValues();
  var selectedCountries = [];
  
  for (var i = 0; i< countries.length; i++) {
    if (countries[i][0] === 'x') {
      selectedCountries.push(countries[i][1])
    }
  }
  
  var newSpreadsheetName = 'Inventory for ' + getTitle(podcastId) + ' for ' + getStartDate() + ' - ' + getEndDate();
  var spreadsheet = SpreadsheetApp.create(newSpreadsheetName)
  SpreadsheetApp.setActiveSpreadsheet(spreadsheet)
  
  for (var i = 0; i< selectedCountries.length; i++) {
    if(i>0) {spreadsheet.insertSheet();}
      spreadsheet.setActiveSheet(spreadsheet.getSheets()[i]).setName(selectedCountries[i])
      runQuery(selectedCountries[i], spreadsheet, i, podcastId)
  }
  
  /*
  var countries = [['United States', 1],
                    ['Germany',8],
                    ['Australia',15],
                    ['United Kingdom',22],
                   ['Canada', 29]]
  for(var i = 0; i < countries.length; i++) {                
     runQuery(24, countries[i])
  }
  */
  
    var htmlOutput = HtmlService
  .createHtmlOutput('<p><a href= "'+spreadsheet.getUrl()+'" target="_blank">'+newSpreadsheetName+'</a></p>')
  .setWidth(500)
  .setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Spreadsheet Created')
}



function showAdStructure (podcastId) {
  var url = 'https://prx-dovetail.s3.amazonaws.com/config/programs.production.json';
  var res = UrlFetchApp.fetch(url).getContentText()
  var showStructures = JSON.parse(res)
  var show = {}
  var showFormats = []
  
  var url = 'http://feeder.prx.org/api/v1/podcasts/'+podcastId
  var res = UrlFetchApp.fetch(url).getContentText();
  var path = JSON.parse(res).path;
  
  if(path in showStructures){
    show = showStructures[path].placements;
  }
    
  //if there is only one placement just check it
  if(typeof show === 'array') {
    showFormats.push(show)
  }
  //if there are multiple placements sort them into an array
  if(typeof show === 'object') {
    var keys = Object.keys(show);
    for (var i = 0; i < keys.length; i++) {
      showFormats.push(show[keys[i]]);
    }
  }
  
  //go through show Formats it into {structure: (number of originals), mids: (number of mid impressions)}
  var structureByMids = []
  for (var i = 0; i < showFormats.length; i++) {
    structureByMids.push({structure:0, mids:0});
    for(var j = 0; j < showFormats[i].length; j++){
      if(showFormats[i][j].type == "original") {
        structureByMids[i].structure++
      }
      
      var id = showFormats[i][j].id
      Logger.log(id)
      var find = '_mid_';
      Logger.log(path)
      if(id.search(find) != -1){
        structureByMids[i].mids++;
      }
    }
    structureByMids[i].mids = structureByMids[i].mids/2;
  }
    Logger.log(structureByMids)
  return structureByMids

}

function sortDataIntoPreAndMid (podcastId, data) {
    //[Pre, Mid, adfree [ row of table [ date, Listens]]]
    var preroll = [] 
    var midrollA = []
    var midrollB = []
    var midStructure = showAdStructure(podcastId);
    var date = new Date();
    var newDate = new Date();
    //Builds PreRoll Table
    for(var i = 55; i >= 0;i--){
      date = new Date ();
      newDate = new Date(date.setDate(date.getDate() - date.getDay() - i));
      preroll.push([newDate, 0]);
    }
  
    for(var i = 0; i< data.length; i++) {
      for( var j = 0; j< preroll.length; j++) {
        if(formatDate(preroll[j][0]) == formatDate(new Date(data[i][0])) && data[i][3] != "Ad Free") {
        preroll[j][1] = preroll[j][1] + Number(data[i][1])
        }
      }
    }
    //Build MidRoll A Table
    //Build MidRoll B Table
    for(var i = 55; i >= 0;i--){
      date = new Date ();
      newDate = new Date(date.setDate(date.getDate() - date.getDay() - i));
      midrollA.push([newDate, 0]);
    }

    for(var i = 55; i >= 0;i--){
        date = new Date ();
        newDate = new Date(date.setDate(date.getDate() - date.getDay() - i));
        midrollB.push([newDate, 0]);
      }
  
    for(var k = 0; k < midStructure.length; k++) {
      Logger.log(midStructure[k].structure)
        if(midStructure[k].mids > 0) {
            for(var i = 0; i< data.length; i++) {
                for( var j = 0; j< midrollA.length; j++) {
                  if(formatDate(midrollA[j][0]) == formatDate(new Date(data[i][0])) && data[i][3] == midStructure[k].structure) {
                  midrollA[j][1] = midrollA[j][1] + Number(data[i][1])
                  }
                }
              }

        }

        if(midStructure[k].mids > 1) {
            for(var i = 0; i< data.length; i++) {
                for( var j = 0; j< midrollB.length; j++) {
                  if(formatDate(midrollB[j][0]) == formatDate(new Date(data[i][0])) && data[i][3] == midStructure[k].structure) {
                  midrollB[j][1] = midrollB[j][1] + Number(data[i][1])
                  }
                }
              }
        }

    }
    

 
    return [preroll, midrollA, midrollB]
  }

function getPodcastEpisodes (podcastId) {
  //queries 1000 of the latest episodes for a podcast
  var url = 'http://feeder.prx.org/api/v1/podcasts/'+podcastId+'/episodes?per=1000'
  var res = UrlFetchApp.fetch(url).getContentText();
  var content = JSON.parse(res)._embedded['prx:items'];
  
  
  var episodes = []
  for (var i = 0; content.length > i; i++) {  
    episodes.push([formatReleaseDate(content[i].publishedAt), content[i].title, content[i].id]);
    
    if(content[i].categories.length > 0) {
      for (var j = 0; content[i].categories.length > j; j++) {
        if(content[i].categories[j] == 'adfree') {
          episodes[i].push('adfree')
        } 
      }
      
      
    }if (episodes[i][3] != 'adfree') {
      episodes[i].push(content[i].media.length);
    }
  }
  //returns and reorders the list to earliest to latest
  return episodes.reverse();
  
};


//
// Insert our customize menu item
//
function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries = [ {name: 'Create from Selected Cell', functionName: 'test'}, {name:'Query countries', functionName: 'quearyEachCounrty'}];
  sheet.addMenu('Create Inventory Sheet', menuEntries);
};

//format's date into yyyy-mm-dd
function formatDate(unformatedDate) {
  var dateObject = new Date(unformatedDate);
  var reformatedDate = dateObject.getYear() + '-' + (dateObject.getMonth() +1)+ '-' + dateObject.getDate();
  return reformatedDate
}

function formatReleaseDate(unformatedDate) {
  var dateObject = new Date(unformatedDate);
  dateObject = new Date(dateObject.setDate(dateObject.getDate() - 1));
  var reformatedDate = dateObject.getYear() + '-' + (dateObject.getMonth() +1)+ '-' + (dateObject.getDate());
  return reformatedDate
}

//Finds last Sunday and returns it as a TIMESTAMP readable date
function getStartDate () {
    var date = new Date();
    var eightWeeksAgo = new Date(date.setDate(date.getDate() - date.getDay() - 55));
    var startDate = formatDate(eightWeeksAgo);
    return startDate;
}

//Finds 8 weeks before last Sunday and returns a TIMESTAMP readable date.
function getEndDate () {
  
    var date = new Date();
    var prevMonday = new Date(date.setDate(date.getDate() - date.getDay() + 2));
    var endDate = formatDate(prevMonday);
    return endDate
}


//Sort Podcasts for easy query building based on structure.
function sortPodcasts(episodeList) {
  var sortedList = [];
  var maxStructureSize = 0
  for (var i = 0; episodeList.length>i;i++) {
    if ((episodeList[i][3]) > maxStructureSize){
      maxStructureSize = (episodeList[i][3]);
    }
  }
  for(var i = 0; maxStructureSize>= i; i++) {
    sortedList.push([]);
  }
  for (var i = 0; episodeList.length > i; i++) {
    if(episodeList[i][3] == 'adfree') {
      sortedList[0].push(episodeList[i][2]);
    }else if(episodeList[i][3] > 0) {
      sortedList[episodeList[i][3]].push(episodeList[i][2]);
    }else if(episodeList[i][3] === 0) {
      Logger.log('no media at ' + episodeList[i])
    }else{
      Logger.log('unknown structure at ' + episodeList[i]);
    }
  }
  return sortedList
}

function buildSQLQuery(podcastId, episodes, country) {
  
  var episodesByStructure = sortPodcasts(episodes);
  var endDate = getEndDate ();
  var startDate = getStartDate();
  
  var sql = "select EXTRACT(DATE from timestamp) as day, COUNT(*) as count, country_name, CASE "  
  
  var currentList = episodesByStructure[0]
  
  if(currentList.length == 1) {
    sql = sql + " WHEN feeder_episode = '" + currentList[0] + "' THEN 'Ad Free ' "
  } else if (currentList.length > 1) {
    sql = sql + " WHEN feeder_episode IN ( "
    
    for(var i = 0;currentList.length-1 > i; i++) {
      sql = sql + "'" +currentList[i] + "', ";
    }
    sql = sql + "'" + currentList[currentList.length -1] + "' ) THEN 'Ad Free' ";
  }
  
  for(var j = 1; j < episodesByStructure.length; j++) {
  currentList = episodesByStructure[j]
  if(currentList.length === 1) {
    sql = sql + " WHEN feeder_episode = '" + currentList[0] + "' THEN '"+ j +"' "
  } else if (currentList.length > 1) {
    sql = sql + " WHEN feeder_episode IN ( "
    
    for(var i = 0;currentList.length-1 > i; i++) {
      sql = sql + "'" + currentList[i] + "', ";
    }
    sql = sql + "'" + currentList[currentList.length -1] + "' ) THEN '"+ j +"' ";
  }
}

  
  sql = sql + " ELSE 'Missing' END AS structure FROM production.dt_downloads" + 
    " join production.geonames on (country_geoname_id = geoname_id) where timestamp >= '" +
    startDate
    +"' AND timestamp <= '"+
    endDate + 
    "' AND country_name = '" +
      country +
        "' AND feeder_podcast = " 
    + podcastId + 
      " AND is_duplicate = false GROUP BY day, structure, country_name order by country_name asc, structure asc, day asc;"

  return sql
}

//updates sheet data
function runQuery(country, spreadsheet, page, podcastId) {

  //select spreadsheet
  //var inputSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  //inputSpreadsheet.setActiveSheet(inputSpreadsheet.getSheets()[0]);
  //var inputSheet = SpreadsheetApp.getActiveSheet();
  
  //var newSpreadsheetName = 'Inventory for ' + getTitle(podcastId) + ' for ' + getStartDate() + ' - ' + getEndDate();
  //var spreadsheet = SpreadsheetApp.create(newSpreadsheetName)
  //SpreadsheetApp.setActiveSpreadsheet(spreadsheet)
  spreadsheet.setActiveSheet(spreadsheet.getSheets()[page])
  var sheet = SpreadsheetApp.getActiveSheet();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var episodes = getPodcastEpisodes(podcastId);
  var sortedEpisodes = sortPodcasts(episodes);
  
  var projectId = '301376532368';
  
  
  var sql = buildSQLQuery(podcastId, episodes, country);
    
    
  var request = {
    query: sql,
    useLegacySql: false, 
  };
  var queryResults = BigQuery.Jobs.query(request, projectId);
  var jobId = queryResults.jobReference.jobId;

  // Check on status of the Query Job.
  var sleepTimeMs = 500;
  while (!queryResults.jobComplete) {
    Utilities.sleep(sleepTimeMs);
    sleepTimeMs *= 2;
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
  }

  // Get all the rows of results.
  var rows = queryResults.rows;
  while (queryResults.pageToken) {
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId, {
      pageToken: queryResults.pageToken
    });
    rows = rows.concat(queryResults.rows);
  }

  if (rows) {
    
    // Append the headers.
    var headers = queryResults.schema.fields.map(function(field) {
      return field.name;
    });
    headers.push('title');
    //sheet.appendRow(headers);

    // Append the results.
    var data = new Array(rows.length);
    var publishDate;
    for (var i = 0; i < rows.length; i++) {
      var cols = rows[i].f;
      data[i] = new Array(cols.length);
      for (var j = 0; j < cols.length; j++) {
        data[i][j] = cols[j].v;
      }
    }
    
    var sortedData = sortDataIntoPreAndMid (podcastId, data);
    

    var sheet = SpreadsheetApp.getActiveSheet()
    
    for (var k = 0; k < sortedData.length; k++) {
    data = sortedData[k]
    //add episode names
    
    var dropWeek = false;
      for(var i = 0; i < (data.length); i++) {
        publishDate = formatDate(data[i][0]);
        
        for (var j=0; j < episodes.length; j++) {
          if(publishDate == episodes[j][0]) {
            data[i].push(episodes[j][1]);

          }
        }
        if (3 > data[i].length){
          data[i].push('');
        }
      }

      var avgDropWeek = [0, 0]
      var minDropWeek = 0
      var avgNonDropWeek = [0,0]
      var minNonDropWeek = 0
      for(var i = 0; i< data.length; i++) {
        if(data[i][2] != '') {
          dropWeek = true
          Logger.log(true)
        }
        if(i%7==6){
          var avg = data[i][1]+data[i-1][1]+data[i-2][1]+data[i-3][1]+data[i-4][1]+data[i-5][1]+data[i-6][1]
          //avg = Math.round(avg/7)
          if(dropWeek == true) {
            data[i].push([avg], '')
            avgDropWeek[0] = avgDropWeek[0]+ avg
            avgDropWeek[1]++
            dropWeek = false
            if(avg< minDropWeek || minDropWeek == 0 ) { minDropWeek = avg }
          }else {
            data[i].push('', avg); 
            avgNonDropWeek[0] = avgNonDropWeek[0] + avg
            avgNonDropWeek[1]++
            if(avg< minNonDropWeek || minNonDropWeek == 0 ) { minNonDropWeek = avg}
          }
        } else { data[i].push('','')}
      }
      
      if(avgDropWeek[1] != 0) {
        avgDropWeek[0] = Math.round(avgDropWeek[0]/avgDropWeek[1]) 
      }
      if(avgNonDropWeek[1] != 0) {
        avgNonDropWeek[0] = Math.round(avgNonDropWeek[0]/avgNonDropWeek[1])
      }
      
      data.push(['','','Average',avgDropWeek[0],avgNonDropWeek[0]]);
      data.push(['','','Minimum', minDropWeek, minNonDropWeek]);

      
      var zones = ['PreRoll', 'MidRoll A', 'MidRoll B']
      data.unshift([zones[k], '', '', '', ''], ['Date', 'Downloads', 'Episode Drop', 'Drop Week', 'Non Drop Week'])
      sheet.getRange(2, k*7+1, (data.length), data[0].length).setValues(data);
     
    }
    
    
    Logger.log('Results spreadsheet updated: %s',
        spreadsheet.getUrl());
    

    
  } else {
    Logger.log('No rows returned.');
    
  }
  
  var boxArray = ['A3:E3', 'C60:E61', 'H3:L3', 'J60:L61', 'O3:S3', 'Q60:S61']
  
  tinyBoxing(boxArray, spreadsheet, page);
  
  boxArray = ['A4:E10', 'A11:E17', 'A18:E24', 'A25:E31', 'A32:E38', 'A39:E45', 'A46:E52', 'A53:E59',
             'H4:L10', 'H11:L17', 'H18:L24', 'H25:L31', 'H32:L38', 'H39:L45', 'H46:L52', 'H53:L59',
             'O4:S10', 'O11:S17', 'O18:S24', 'O25:S31', 'O32:S38', 'O39:S45', 'O46:S52', 'O53:S59']
  
  largeBoxing(boxArray, spreadsheet, page);
  

}
// [END apps_script_bigquery_run_query]

