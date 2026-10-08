(function (root) {
  'use strict';
  // UN M49 geographic assignments; North America combines Northern America,
  // Central America and the Caribbean. Only the requested 195 states appear.
  const regions = {
    'Africa': `dz|Algeria
ao|Angola
bj|Benin
bw|Botswana
bf|Burkina Faso
bi|Burundi
cv|Cabo Verde|Cape Verde
cm|Cameroon
cf|Central African Republic|CAR
td|Chad
km|Comoros
cg|Republic of the Congo|Congo|Congo Brazzaville
cd|Democratic Republic of the Congo|DR Congo|DRC|Congo Kinshasa|Democratic Republic of Congo
ci|Côte d’Ivoire|Ivory Coast|Cote d Ivoire
dj|Djibouti
eg|Egypt
gq|Equatorial Guinea
er|Eritrea
sz|Eswatini|Swaziland
et|Ethiopia
ga|Gabon
gm|Gambia|The Gambia
gh|Ghana
gn|Guinea
gw|Guinea-Bissau|Guinea Bissau
ke|Kenya
ls|Lesotho
lr|Liberia
ly|Libya
mg|Madagascar
mw|Malawi
ml|Mali
mr|Mauritania
mu|Mauritius
ma|Morocco
mz|Mozambique
na|Namibia
ne|Niger
ng|Nigeria
rw|Rwanda
st|São Tomé and Príncipe|Sao Tome & Principe
sn|Senegal
sc|Seychelles
sl|Sierra Leone
so|Somalia
za|South Africa
ss|South Sudan
sd|Sudan
tz|Tanzania|United Republic of Tanzania
tg|Togo
tn|Tunisia
ug|Uganda
zm|Zambia
zw|Zimbabwe`,
    'Asia': `af|Afghanistan
am|Armenia
az|Azerbaijan
bh|Bahrain
bd|Bangladesh
bt|Bhutan
bn|Brunei|Brunei Darussalam
kh|Cambodia
cn|China|People's Republic of China|PRC
cy|Cyprus
ge|Georgia
in|India
id|Indonesia
ir|Iran|Islamic Republic of Iran
iq|Iraq
il|Israel
jp|Japan
jo|Jordan
kz|Kazakhstan
kw|Kuwait
kg|Kyrgyzstan
la|Laos|Lao People's Democratic Republic|Lao PDR
lb|Lebanon
my|Malaysia
mv|Maldives
mn|Mongolia
mm|Myanmar|Burma
np|Nepal
kp|North Korea|Democratic People's Republic of Korea|DPRK
om|Oman
pk|Pakistan
ps|Palestine|State of Palestine
ph|Philippines|The Philippines
qa|Qatar
sa|Saudi Arabia
sg|Singapore
kr|South Korea|Republic of Korea|ROK
lk|Sri Lanka
sy|Syria|Syrian Arab Republic
tj|Tajikistan
th|Thailand
tl|Timor-Leste|East Timor|Timor Leste
tr|Türkiye|Turkey
tm|Turkmenistan
ae|United Arab Emirates|UAE
uz|Uzbekistan
vn|Vietnam|Viet Nam
ye|Yemen`,
    'Europe': `al|Albania
ad|Andorra
at|Austria
by|Belarus
be|Belgium
ba|Bosnia and Herzegovina|Bosnia & Herzegovina|Bosnia
bg|Bulgaria
hr|Croatia
cz|Czechia|Czech Republic
dk|Denmark
ee|Estonia
fi|Finland
fr|France
de|Germany
gr|Greece
va|Vatican City|Vatican|Holy See|The Vatican
hu|Hungary
is|Iceland
ie|Ireland|Republic of Ireland
it|Italy
lv|Latvia
li|Liechtenstein
lt|Lithuania
lu|Luxembourg
mt|Malta
md|Moldova|Republic of Moldova
mc|Monaco
me|Montenegro
nl|Netherlands|The Netherlands|Holland
mk|North Macedonia|Republic of North Macedonia|Macedonia
no|Norway
pl|Poland
pt|Portugal
ro|Romania
ru|Russia|Russian Federation
sm|San Marino
rs|Serbia
sk|Slovakia|Slovak Republic
si|Slovenia
es|Spain
se|Sweden
ch|Switzerland
ua|Ukraine
gb|United Kingdom|UK|Britain|Great Britain|United Kingdom of Great Britain and Northern Ireland`,
    'North America': `ag|Antigua and Barbuda|Antigua & Barbuda
bs|Bahamas|The Bahamas
bb|Barbados
bz|Belize
ca|Canada
cr|Costa Rica
cu|Cuba
dm|Dominica
do|Dominican Republic
sv|El Salvador
gd|Grenada
gt|Guatemala
ht|Haiti
hn|Honduras
jm|Jamaica
mx|Mexico
ni|Nicaragua
pa|Panama
kn|Saint Kitts and Nevis|St Kitts and Nevis|Saint Kitts & Nevis|St Kitts & Nevis
lc|Saint Lucia|St Lucia
vc|Saint Vincent and the Grenadines|St Vincent and the Grenadines|Saint Vincent & the Grenadines|St Vincent & the Grenadines
tt|Trinidad and Tobago|Trinidad & Tobago
us|United States|USA|US|United States of America`,
    'South America': `ar|Argentina
bo|Bolivia|Plurinational State of Bolivia
br|Brazil
cl|Chile
co|Colombia
ec|Ecuador
gy|Guyana
py|Paraguay
pe|Peru
sr|Suriname|Surinam
uy|Uruguay
ve|Venezuela|Bolivarian Republic of Venezuela`,
    'Oceania': `au|Australia
fj|Fiji
ki|Kiribati
mh|Marshall Islands|The Marshall Islands
fm|Micronesia|Federated States of Micronesia|FSM
nr|Nauru
nz|New Zealand|NZ
pw|Palau
pg|Papua New Guinea|PNG
ws|Samoa
sb|Solomon Islands|The Solomon Islands
to|Tonga
tv|Tuvalu
vu|Vanuatu`
  };
  const countries = Object.entries(regions).flatMap(([region, rows]) =>
    rows.split('\n').map(row => {
      const [code, name, ...aliases] = row.split('|');
      return Object.freeze({ code, name, region, aliases: Object.freeze(aliases) });
    })
  );
  const data = Object.freeze({ countries: Object.freeze(countries), regions: Object.freeze(['World', ...Object.keys(regions)]) });
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.FlagData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
