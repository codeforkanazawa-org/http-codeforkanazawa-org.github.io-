require "csv"
require "json"

# 読み込むCSVファイル名
csvFileName = "source/5374_cities.csv"
# 出力するJSONファイル名
jsonFileName = "source/localizable/5374.json.erb"

# 都道府県
pref = Array.new(48) {|num| {
    code: num,
    name: "<%= t(:prefecture"+num.to_s+") %>",
    cities: Array.new,
  }
}

# 地方
dist = Array.new(9) {|num| {
  code: num,
    name: "<%= t(:area"+num.to_s+") %>",
    prefectures: Array.new,
  }
}

# CSVを読み込んで都道府県に市区町村を追加していく。
first = false
CSV.foreach(csvFileName) do |row|
  unless first then
    first = true
    next
  end

  pref[row[0].to_s[0,2].to_i][:cities].push({
    code: row[0],
    name: "<%= t(:city"+row[0]+") %>",
    url: row[4],
    latitude: row[5],
    longitude: row[6],
    date: row[3],
    })
end

# 都道府県を各地方に割り振る。
pref.each_with_index {|p, num|
  # 市区町村が1つもなし(=その県で5374が作られていない)場合は出力しない。
  if p[:cities].length == 0 then
    next
  end

  # 予め県内で市区町村をソートしておく。
  p[:cities].sort!{|a, b| a[:code] <=> b[:code] }

  def to_dist_index(num)
    if num == 1 then
      1
    elsif num <= 7 then
      2
    elsif num <= 14 then
      3
    elsif num <= 23 then
      4
    elsif num <= 30 then
      5
    elsif num <= 35 then
      6
    elsif num <= 39 then
      7
    elsif num <= 47 then
      8
    else
      0
    end
  end

  dist[to_dist_index(num)][:prefectures].push(p)
}

output = {
  # 都道府県がない地方(その地方で1つも5374が作られていない)場合は出力しない
  areas: dist.select {|v| v[:prefectures].length != 0 }
}

File.open(jsonFileName,'w').write(JSON.pretty_generate(output))
