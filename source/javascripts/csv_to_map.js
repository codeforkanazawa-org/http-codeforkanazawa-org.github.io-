"use strict";

//----------------setting-----------
//最新更新の要素数を指定します。
var LATEST_ELEMENTS=5

var CITYIES_FILE="5374_cities.csv"
//選択されているAreaのオブジェクトです。
//0-地区コード,1-地区名,2-地区名（ひらがな）,3-都道府県,4-更新日時,5-URL,6-緯度,7-経度
//が各インデックスに対応しております。
var REGION_CODE=0
var REGION_NAME=1
var REGION_KANA=2
var REGION_ENGL=3
var PREF_NAME=4
var ADD_DATE=5
var URL=6
var LATITUDE=7
var LOGITITUDE=8

//ローカライズ用にパスが深いかどうか判断するため
var LOCALIZE_LIST=["en"]


//-----------global variable---------

//全地区を管理するリストです。
var area_list=Array()

var selectedArea;
var latestArea=Array()

var isLocalize=isLocalizePath(location.pathname)

var googleMap

var openInfoWindow

/**
  csvを配列にします。
*/
function csvToArray(filename, cb) {
  $.get(filename, function(csvdata) {
    //CSVのパース作業
    csvdata = csvdata.replace(/\r/gm, "");
    var line = csvdata.split("\n"),
    ret = [];
    for (var i in line) {
      //空行はスルーする。
      if (line[i].length == 0) continue;

      var row = line[i].split(",");
      ret.push(row);
    }
    cb(ret);
  });
}



function compareDate(dateA,dateB){
  function toInt(v){
    return v-0
  }

  var tmpA=dateA.split(".").map(toInt)
  var tmpB=dateB.split(".").map(toInt)
  for (var i=0;i<tmpA.length;i++){
    if (tmpA[i]<tmpB[i]){
      return -1
    }else if (tmpA[i]>tmpB[i]){
      return 1
    }
  }
  return 0
}

/**
挿入ソートのような感じで、日付の降順に要素を挿入します。
*/
function insertList(current,area){
  for (var i in area){
    if (compareDate(current[ADD_DATE],area[i][ADD_DATE])>=0){
      //参考 http://lostlinksearch.net/blog/2013/06/javascript%E3%81%A7%E9%85%8D%E5%88%97%E3%81%AE%E4%BB%BB%E6%84%8F%E3%81%AE%E4%BD%8D%E7%BD%AE%E3%81%AB%E8%A6%81%E7%B4%A0%E3%82%92%E8%BF%BD%E5%8A%A0%E3%81%99%E3%82%8B-insert/
      latestArea.splice(i,0,current);
      return;
    }
  }
  //ここまで来たら最後の要素に追加
  latestArea.push(current)

}

//地図上にマーカーを置きます。

function putMarker(map,current){

  var latlng = new google.maps.LatLng(current[LATITUDE]-0,current[LOGITITUDE]-0);
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    title:current[REGION_NAME]
  });

  var url=current[URL]
  var areaName=isLocalize?current[REGION_ENGL]:current[REGION_NAME]+"("+current[REGION_KANA]+")"

  var infowindow=new google.maps.InfoWindow({
    content:"<div class='info_window'>"+areaName+"<br>"+"<a href='"+url+"'>"+url+"</a>"+"<br>"+"更新日"+current[ADD_DATE]+"</div>"
  });

  var infoCall=function(){
    infowindow.open(map,marker)
    //すでに開かれてるパルーンは閉じる。
    if (openInfoWindow){
      openInfoWindow.close()
    }
    openInfoWindow=infowindow

  };
  google.maps.event.addListener(marker, 'click',infoCall);

}


function addData(current){
  var prefCode=getPrefCode(current)

  if (area_list[prefCode]){
    //nop
  }else{
    area_list[prefCode]=Array();
  }
  area_list[prefCode].push(current);

  insertList(current,latestArea);

  if (latestArea.length>=LATEST_ELEMENTS){

    latestArea=latestArea.splice(0,LATEST_ELEMENTS);
  }

}

function showLatestData(){

  var lastest_html=""
  for (var i in latestArea){
    var area=latestArea[i]
    lastest_html+="<p>"+area[ADD_DATE]+"に<a href='"+area[URL]+"'>"+area[REGION_NAME]+"版5374</a>が作成されました。</p>"
  }


  $("#latest_list").html(lastest_html)

}


function getPrefCode(city){
  var code=city[REGION_CODE]
  return code.substring(0,2)
}


//都道府県が変更された時に呼ばれます。
function prefectureChange(){

  //http://qiita.com/tomcky/items/8f1868f1fb963732de39
  var selectedOption=$("#prefecture_area").find("option:selected")[0]
  var selectedPref=$(selectedOption).attr("code")

  selectedArea= area_list[selectedPref]

  var city_area_option_html=""

  var cityAreaOption=$("#city_area")

  if (selectedArea == undefined){
    city_area_option_html="<option>"+cityAreaOption.attr("emptyLabel")+"</option>"
  }
  else{
    city_area_option_html+="<option>"+cityAreaOption.attr("label")+"</option>"
    for (var i in selectedArea){
      var city=selectedArea[i]
      var insertName=isLocalize?city[REGION_ENGL]:city[REGION_NAME]

      city_area_option_html+="<option code='"+city[REGION_CODE]+"'>"+insertName+"</option>"

    }

  }


  cityAreaOption.html(city_area_option_html)
  //最初の変更を呼び出す
  cityChange()

}

function selectedCityCodeFromOption(){
  var selectedCity=$("#city_area").find("option:selected")[0]
  var selectedCityCode=$(selectedCity).attr("code")
  return selectedCityCode
}


//市町村が変更された時に呼ばれます。
function cityChange(){
  var selectedCityCode=selectedCityCodeFromOption()

  for (var i in selectedArea){
    var city=selectedArea[i]
    if (city[REGION_CODE]==selectedCityCode){
      googleMap.panTo(new google.maps.LatLng(city[LATITUDE],city[LOGITITUDE]));
      //15はなんとなく
      googleMap.setZoom(15)
      return
    }
  }
}

//選択した都道府県と市町村で対象のページにジャンプします。
function goPage(){
  var selectedCityCode=selectedCityCodeFromOption()

  for (var i in selectedArea){
    if (selectedArea[i][REGION_CODE]==selectedCityCode){
      window.open(selectedArea[i][URL])
      return
    }
  }
}


function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyBNJWgPCGFRNCcs7ZMf10ydCgwnDisGVUU&sensor=TRUE&callback=initialize";
  document.body.appendChild(script);

}
//locationデータからローカライズ用パスかどうか判断する
function isLocalizePath(path){
  var split=path.split("/")
  split.pop()

  return LOCALIZE_LIST.indexOf(split[split.length-1])>=0

}

//Google Mapの初期化が終わった後に呼ばれます。
function initialize() {
  var mapOptions = {
    zoom: 8,
    center: new google.maps.LatLng(36.561325,136.656205),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  googleMap= new google.maps.Map(document.getElementById("map_canvas"), mapOptions);


  var cityFilePath=(isLocalize?"../":"") +CITYIES_FILE

  csvToArray(cityFilePath,function(data){
    //ラベル部分は落とす
    var label = data.shift();
    //地図にマーカーをたてる
    for (var i in data){
      putMarker(googleMap,data[i]);
      addData(data[i])
    }

    //各都道府県の市区町村をソートする。
    for (var i in area_list){
      area_list[i].sort()
    }


    //初めに変更されたとして呼ぶ
    prefectureChange();

    $("#prefecture_area").change(prefectureChange)

    $("#city_area").change(cityChange)

    $("#go_page").click(goPage)

    showLatestData()

  })

}

window.onload = loadScript;
