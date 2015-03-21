"use strict";
//全地区データです。
var area_list=Array()
//選択されているAreaのオブジェクトです。
//0-地区名,1-地区名（ひらがな）,2-都道府県,3-更新日時,4-URL,5-緯度,6-経度
//が各インデックスに対応しております。
var selectedArea;


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

  if (area_list[current[2]]){
    //nop
  }else{
    area_list[current[2]]=Array()
  }
  area_list[current[2]].push(current)
}




//都道府県が変更された時に呼ばれます。
function prefectureChange(){

  //http://qiita.com/tomcky/items/8f1868f1fb963732de39
  var selectedPref=$("#prefecture_area").find("option:selected").text()

  selectedArea= area_list[selectedPref]

  var city_area_option_html=""

  for (var i in selectedArea){

    var cities=selectedArea[i]
    city_area_option_html+="<option>"+cities[0]+"</option>"

  }

  if (city_area_option_html.length==0){
    city_area_option_html="<option>この地域はまだ作られておりません。</option>"
  }

  $("#city_area").html(city_area_option_html)

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
  var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);


  csvToArray("5374_cities.csv",function(data){
    //ラベル部分は落とす
    var label = data.shift();
    //地図にマーカーをたてる
    for (var i in data){
      putMarker(map,data[i])
    }

    //初めに変更されたとして呼ぶ
    prefectureChange();

    $("#prefecture_area").change(prefectureChange)

    $("#go_page").click(goPage)


  })

}

window.onload = loadScript;
