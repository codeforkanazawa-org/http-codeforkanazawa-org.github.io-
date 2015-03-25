require "csv"
require "json"
jsonFile = File.open("source/localizable/5374.json.erb",'w');
jsonData = {}
dist = {}
pref = {}
i = 0
for num in 1..47 do
  pref[num] = {
    code: num,
    name: "<%= t(:prefecture"+num.to_s+") %>",
    cities: Array.new,
  }
end
for num in 1..8 do
  dist[num] = {
    code: num,
    name: "<%= t(:area"+num.to_s+") %>",
    prefectures: Array.new,
  }
end
CSV.foreach("source/5374_cities.csv") do |row|

  jsonData[row[0]] = {
    code: row[0],
    name: "<%= t(:city"+row[0]+") %>",
    url: row[4],
    latitude: row[5],
    longitude: row[6],
    date: row[3],
    };

    if i != 0 then
      pref[row[0].to_s[0,2].to_i][:cities].push(jsonData[row[0]]);
    end
    i+=1
  end

  for num in 1..47 do
    pref[num][:cities].sort!{|a, b| a[:code] <=> b[:code] }
  end

  for num in 1..47 do
    if pref[num][:cities].length == 0 then
      next
    end
    if num == 1 then
      dist[1][:prefectures].push(pref[num])
    elsif num <= 7 then
      dist[2][:prefectures].push(pref[num])
    elsif num <= 14 then
      dist[3][:prefectures].push(pref[num])
    elsif num <= 23 then
      dist[4][:prefectures].push(pref[num])
    elsif num <= 30 then
      dist[5][:prefectures].push(pref[num])
    elsif num <= 35 then
      dist[6][:prefectures].push(pref[num])
    elsif num <= 39 then
      dist[7][:prefectures].push(pref[num])
    elsif num <= 47 then
      dist[8][:prefectures].push(pref[num])
    end
  end
  values = Array.new
  for num in 1..8 do
    if dist[num][:prefectures].length == 0 then
      next
    end
    values.push(dist[num])
  end
  areas = {
    areas: values
  }
  jsonFile.write(JSON.pretty_generate(areas));