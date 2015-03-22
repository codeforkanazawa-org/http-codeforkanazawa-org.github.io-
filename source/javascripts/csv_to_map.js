"use strict";

//最新更新の要素数を指定します。
var LATEST_ELEMENTS=5

//全地区データです。
var area_list=Array()
//選択されているAreaのオブジェクトです。
//0-地区名,1-地区名（ひらがな）,2-都道府県,3-更新日時,4-URL,5-緯度,6-経度
//が各インデックスに対応しております。
var selectedArea;


var latestArea=Array()

var googleMap

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



function compareDate(A,B){
  function toInt(v){
    return v-0
  }

  var tmpA=A[3].split(".").map(toInt)
  var tmpB=B[3].split(".").map(toInt)
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
挿入ソートのような感じで要素を挿入します。
*/
function insertList(current){
  for (var i in latestArea){
    if (compareDate(current,latestArea[i])>=0){
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

  var latlng = new google.maps.LatLng(current[5]-0,current[6]-0);
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    title:current[0]
  });

  var url=current[4]
  var areaFull=current[2]+current[0]
  var infowindow=new google.maps.InfoWindow({
    content: areaFull+"<br>"+"<a href='"+url+"'>"+url+"</a>"+"<br>"+"更新日"+current[3]
  });

  var infoCall=function(){infowindow.open(map,marker)};
  google.maps.event.addListener(marker, 'click',infoCall);

}

function addData(current){
  if (area_list[current[2]]){
    //nop
  }else{
    area_list[current[2]]=Array();
  }
  area_list[current[2]].push(current);

  insertList(current);

  if (latestArea.length>=LATEST_ELEMENTS){

    latestArea=latestArea.splice(0,LATEST_ELEMENTS);
  }

}

function showLatestData(){

  var lastest_html=""
  for (var i in latestArea){
    var area=latestArea[i]
    lastest_html+="<p>"+area[3]+"に<a href='"+area[4]+"'>"+area[0]+"版5374</a>が作成されました。</p>"
  }


  $("#latest_list").html(lastest_html)

}

//都道府県が変更された時に呼ばれます。
function prefectureChange(){

  //http://qiita.com/tomcky/items/8f1868f1fb963732de39
  var selectedPref=$("#prefecture_area").find("option:selected").text()

  selectedArea= area_list[selectedPref]

  var city_area_option_html=""

  if (selectedArea == undefined){
    city_area_option_html="<option>この地域はまだ作られておりません</option>"
  }
  else{
    city_area_option_html+="<option>エリアを選択してください</option>"
    for (var i in selectedArea){

      var city=selectedArea[i]
      city_area_option_html+="<option>"+city[0]+"</option>"

    }

  }


  $("#city_area").html(city_area_option_html)
  //最初の変更を呼び出す
  cityChange()

}

//市町村が変更された時に呼ばれます。
function cityChange(){

  var selectedCity=$("#city_area").find("option:selected").text()

  for (var i in selectedArea){
    var city=selectedArea[i]
    if (city[0]==selectedCity){
      googleMap.panTo(new google.maps.LatLng(city[5],city[6]));
      //15はなんなく
      googleMap.setZoom(15)
      return
    }
  }
}

//選択した都道府県と市町村で対象のページにジャンプします。
function goPage(){
  var selectedCity=$("#city_area").find("option:selected").text()

  for (var i in selectedArea){
    if (selectedArea[i][0]==selectedCity){
      location.href=selectedArea[i][4]
      break
    }
  }
}


function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyBNJWgPCGFRNCcs7ZMf10ydCgwnDisGVUU&sensor=TRUE&callback=initialize";
  document.body.appendChild(script);

}

//Google Mapの初期化が終わった後に呼ばれます。
function initialize() {
  var mapOptions = {
    zoom: 8,
    center: new google.maps.LatLng(36.561325,136.656205),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  googleMap= new google.maps.Map(document.getElementById("map_canvas"), mapOptions);


  csvToArray("5374_cities.csv",function(data){
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
