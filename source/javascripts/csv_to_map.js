//最新更新の要素数を指定します。
var LATEST_ELEMENTS = 5;

var areas = [];
var googleMap;

$(function() {
  "use strict";
  loadGoogleMaps();
});

function loadGoogleMaps() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyBNJWgPCGFRNCcs7ZMf10ydCgwnDisGVUU&sensor=true&callback=onLoadGoogleMaps";
  document.body.appendChild(script);
}

function onLoadGoogleMaps() {
  setupGoogleMaps();
  load5374Datas();
}

function setupGoogleMaps() {
  var mapOptions = {
    zoom: 8,
    center: new google.maps.LatLng(36.561325, 136.656205),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

function load5374Datas() {
  $.ajax({
    url: '5374.json',
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      areas = data.areas;
      onLoad5374Data();
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      alert('データの取得に失敗しました。cfk-office@codeforkanazawa.orgまでご連絡ください。');
    }
  });
}

function onLoad5374Data() {
  // 地図上にマーカーを配置する。
  putMarkers();

  // 都道府県選択肢を作成する。
  createPrefectureSelect();

  // 更新情報を表示する。
  showLatestData();


  // 都道府県が選択されたら
  $("#prefecture_area").on("change", function() {
    var prefectureCode = parseInt($(this).val());
    createCitySelect(prefectureCode);
  });

  // 市区町村が選択されたら
  $("#city_area").on("change", function() {
    var cityCode = $(this).val();
    var city = getCity(cityCode);

    if (!city) {
      alert('不正な市区町村(' + cityCode + ')が選択されました。cfk-office@codeforkanazawa.orgまでご連絡ください。');
      return;
    }

    googleMap.panTo(new google.maps.LatLng(city.latitude, city.longitude));
    //15はなんなく by ono
    googleMap.setZoom(15);
  });

  // 遷移ボタンが押されたら
  $("#go_page").on("click", function() {
    var cityCode = $("#city_area").val();
    var city = getCity(cityCode);

    if (!city) {
      alert("エリアを選択してください。");
      return;
    }

    location.href = city.url;
  });

  $("#prefecture_area").change();
}

function putMarkers() {
  for (var areaIndex = 0; areaIndex < areas.length; ++areaIndex) {
    var area = areas[areaIndex];
    var prefectures = area.prefectures;

    for (var prefectureIndex = 0; prefectureIndex < prefectures.length; ++prefectureIndex) {
      var prefecture = prefectures[prefectureIndex];
      var cities = prefecture.cities;

      for (var cityIndex = 0; cityIndex < cities.length; ++cityIndex) {
        var city = cities[cityIndex];
        putMarker(prefecture, city);
      }
    }
  }
}

function putMarker(prefecture, city) {
  var latlng = new google.maps.LatLng(city.latitude, city.longitude);
  var marker = new google.maps.Marker({
    position: latlng,
    map: googleMap,
    title: city.name
  });

  var url = city.url;
  var areaFull = prefecture.name + city.name;
  var infowindow = new google.maps.InfoWindow({
    content: areaFull + "<br>" + "<a href='" + url + "'>" + url + "</a>" + "<br>" + "更新日" + city.date
  });

  google.maps.event.addListener(marker, "click", function() {
    infowindow.open(googleMap, marker);
  });
}

function createPrefectureSelect() {
  var optgroups = [];

  for (var areaIndex = 0; areaIndex < areas.length; ++areaIndex) {
    var area = areas[areaIndex];
    var prefectures = area.prefectures;

    var optgroup = $("<optgroup>").attr("label", area.name);

    for (var prefectureIndex = 0; prefectureIndex < prefectures.length; ++prefectureIndex) {
      var prefecture = prefectures[prefectureIndex];

      var option = $("<option>").text(prefecture.name).val(prefecture.code);
      optgroup.append(option);
    }

    optgroups.push(optgroup);
  }

  $("#prefecture_area").empty().append(optgroups);
}

function createCitySelect(prefectureCode) {
  var prefecture = getPrefecture(prefectureCode);

  var options = [];

  options.push($("<option>").text("エリアを選択してください。"));

  var cities = prefecture.cities;

  for (var cityIndex = 0; cityIndex < cities.length; ++cityIndex) {
    var city = cities[cityIndex];
    options.push($("<option>").text(city.name).val(city.code));
  }

  $("#city_area").empty().append(options);
}

function showLatestData() {
  var cities = getAllSortedCities();

  var lastest_html = "";

  for (var cityIndex = 0; cityIndex < cities.length && cityIndex < LATEST_ELEMENTS; ++cityIndex) {
    var city = cities[cityIndex];
    lastest_html += "<p>" + city.date + "に<a href='" + city.url + "'>" + city.name + "版5374</a>が作成されました。</p>";
  }

  $("#latest_list").html(lastest_html);
}

function getArea(areaCode) {
  for (var areaIndex = 0; areaIndex < areas.length; ++areaIndex) {
    var area = areas[areaIndex];
    if (area.code === areaCode) {
      return area;
    }
  }
  return null;
}

function getPrefecture(prefectureCode) {
  var areaCode = getAreaCodeFromPrefectureCode(prefectureCode);
  var area = getArea(areaCode);

  if (!area) {
    return null;
  }

  var prefectures = area.prefectures;
  for (var prefectureIndex = 0; prefectureIndex < prefectures.length; ++prefectureIndex) {
    var prefecture = prefectures[prefectureIndex];
    if (prefecture.code === prefectureCode) {
      return prefecture;
    }
  }

  return null;
}

function getCity(cityCode) {
  var prefectureCode = parseInt(("" + cityCode).substr(0, 2));
  var prefecture = getPrefecture(prefectureCode);

  if (!prefecture) {
    return null;
  }

  var cities = prefecture.cities;
  for (var cityIndex = 0; cityIndex < cities.length; ++cityIndex) {
    var city = cities[cityIndex];
    if (city.code === cityCode) {
      return city;
    }
  }

  return null;
}

function getAllSortedCities() {
  var sortedCities = [];

  for (var areaIndex = 0; areaIndex < areas.length; ++areaIndex) {
    var area = areas[areaIndex];
    var prefectures = area.prefectures;

    for (var prefectureIndex = 0; prefectureIndex < prefectures.length; ++prefectureIndex) {
      var prefecture = prefectures[prefectureIndex];
      var cities = prefecture.cities;

      for (var cityIndex = 0; cityIndex < cities.length; ++cityIndex) {
        var city = cities[cityIndex];
        sortedCities.push(city);
      }
    }
  }

  sortedCities.sort(compareDate);

  return sortedCities;
}

function compareDate(A, B) {
  function toInt(v) {
    return v - 0;
  }

  var tmpA = A.date[3].split(".").map(toInt);
  var tmpB = B.date[3].split(".").map(toInt);
  for (var i = 0; i < tmpA.length; i++) {
    if (tmpA[i] > tmpB[i]) {
      return -1;
    } else if (tmpA[i] < tmpB[i]) {
      return 1;
    }
  }
  return 0;
}

function getAreaCodeFromPrefectureCode(prefectureCode) {
  switch (prefectureCode) {
    case 1: return 1;

    case 2: return 2;
    case 3: return 2;
    case 4: return 2;
    case 5: return 2;
    case 6: return 2;
    case 7: return 2;

    case 8: return 3;
    case 9: return 3;
    case 10: return 3;
    case 11: return 3;
    case 12: return 3;
    case 13: return 3;
    case 14: return 3;

    case 15: return 4;
    case 16: return 4;
    case 17: return 4;
    case 18: return 4;
    case 19: return 4;
    case 20: return 4;
    case 21: return 4;
    case 22: return 4;
    case 23: return 4;

    case 24: return 5;
    case 25: return 5;
    case 26: return 5;
    case 27: return 5;
    case 28: return 5;
    case 29: return 5;
    case 30: return 5;

    case 31: return 6;
    case 32: return 6;
    case 33: return 6;
    case 34: return 6;
    case 35: return 6;

    case 36: return 7;
    case 37: return 7;
    case 38: return 7;
    case 39: return 7;

    case 40: return 8;
    case 41: return 8;
    case 42: return 8;
    case 43: return 8;
    case 44: return 8;
    case 45: return 8;
    case 46: return 8;
    case 47: return 8;
  }

  return 0;
}
