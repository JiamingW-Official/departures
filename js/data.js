/* ═══ FIELD WIDTHS ═══ */
const W_AL=2, W_FN=4, W_DS=14, W_TM=5, W_GT=4, W_ST=9;
const WTOT=W_AL+W_FN+W_DS+W_TM+W_GT+W_ST;

/* Field boundaries for random flip targeting */
const FIELDS=[
  {s:0, e:W_AL},
  {s:W_AL, e:W_AL+W_FN},
  {s:W_AL+W_FN, e:W_AL+W_FN+W_DS},
  {s:W_AL+W_FN+W_DS, e:W_AL+W_FN+W_DS+W_TM},
  {s:W_AL+W_FN+W_DS+W_TM, e:W_AL+W_FN+W_DS+W_TM+W_GT},
  {s:W_AL+W_FN+W_DS+W_TM+W_GT, e:WTOT}
];

/* ═══ DESTINATIONS ═══ */
const DS=[
['NEW YORK-JFK','JFK'],['LOS ANGELES','LAX'],['CHICAGO-OHARE','ORD'],
['SAN FRANCISCO','SFO'],['MIAMI','MIA'],['TORONTO','YYZ'],
['MEXICO CITY','MEX'],['SAO PAULO-GRU','GRU'],['BUENOS AIRES','EZE'],
['LONDON-HEATHROW','LHR'],['PARIS-CDG','CDG'],['FRANKFURT','FRA'],
['AMSTERDAM','AMS'],['MADRID-BARAJAS','MAD'],['ROMA-FIUMICINO','FCO'],
['ZUERICH','ZRH'],['ISTANBUL','IST'],['MUENCHEN','MUC'],
['DUBAI','DXB'],['DOHA','DOH'],['TOKYO-NARITA','NRT'],
['TOKYO-HANEDA','HND'],['HONG KONG','HKG'],['SINGAPORE','SIN'],
['SEOUL-INCHEON','ICN'],['BANGKOK','BKK'],['TAIPEI','TPE'],
['SHANGHAI-PUDONG','PVG'],['BEIJING','PEK'],['DELHI','DEL'],
['MUMBAI','BOM'],['KUALA LUMPUR','KUL'],['SYDNEY','SYD'],
['AUCKLAND','AKL'],['JOHANNESBURG','JNB'],['NAIROBI','NBO'],
['DUBLIN','DUB'],['KOPENHAGEN','CPH'],['OSLO','OSL'],['JAKARTA','CGK'],
['WARSCHAU','WAW'],['BUDAPEST','BUD'],['PRAG','PRG'],['MANCHESTER','MAN'],
['BASEL','BSL'],['IZMIR','ADB'],['KAIRO','CAI'],['POZNAN','POZ'],
['NEWARK','EWR'],['ATLANTA','ATL'],['DALLAS-FTW','DFW'],['HOUSTON','IAH'],
['SEATTLE','SEA'],['DENVER','DEN'],['BOSTON','BOS'],['CANCUN','CUN'],
['BOGOTA','BOG'],['SANTIAGO','SCL'],['LIMA','LIM'],['LISBON','LIS'],
['BARCELONA','BCN'],['VIENNA','VIE'],['BRUSSELS','BRU'],['ATHENS','ATH'],
['STOCKHOLM','ARN'],['HELSINKI','HEL'],['EDINBURGH','EDI'],
['ABU DHABI','AUH'],['JEDDAH','JED'],['CASABLANCA','CMN'],
['ADDIS ABABA','ADD'],['LAGOS','LOS'],['GUANGZHOU','CAN'],
['OSAKA-KANSAI','KIX'],['MANILA','MNL'],['HO CHI MINH','SGN'],
['MELBOURNE','MEL'],['PERTH','PER'],['KOLKATA','CCU'],['SAPPORO','CTS'],
['WASHINGTON-IAD','IAD'],['PHILADELPHIA','PHL'],['MINNEAPOLIS','MSP'],
['DETROIT','DTW'],['CHARLOTTE','CLT'],['PHOENIX','PHX'],
['ORLANDO','MCO'],['SAN DIEGO','SAN'],['PORTLAND','PDX'],
['VANCOUVER','YVR'],['MONTREAL','YUL'],['HAVANA','HAV'],
['PANAMA CITY','PTY'],['RIO DE JANEIRO','GIG'],['BRASILIA','BSB'],
['MILAN-MALPENSA','MXP'],['BERLIN','BER'],['HAMBURG','HAM'],
['DUESSELDORF','DUS'],['GENEVE','GVA'],['NICE','NCE'],
['BUCHAREST','OTP'],['TEL AVIV','TLV'],['MUSCAT','MCT'],
['BAHRAIN','BAH'],['RIYADH','RUH'],['KUWAIT','KWI'],
['CHENNAI','MAA'],['BANGALORE','BLR'],['HANOI','HAN'],
['CHENGDU','CTU'],['SHENZHEN','SZX'],['COLOMBO','CMB'],
['MALE','MLE'],['PHUKET','HKT'],['BALI-DENPASAR','DPS'],
];

/* ═══ AIRPORTS — 76 worldwide ═══ */
function $A(c,n,al,gp,sd,s){return{c,n,s:s||'DEPARTURES',al:al.split(' '),gp:gp.split(' '),sd}}
const AP=[
/* ── EUROPE ── */
$A('FRA','FRANKFURT AM MAIN','LH UA SQ NH CX TK EK AF BA DL MS XQ LO AI AC SA','A B C Z',1,'ABFLUG · DEPARTURES'),
$A('LHR','LONDON HEATHROW','BA VS AA UA EK SQ NH LH AF QF DL TK CX AI','A B C',2),
$A('AMS','AMSTERDAM SCHIPHOL','KL AF LH BA TK EK DL SQ CX UA NH','B C D E F',3,'VERTREK · DEPARTURES'),
$A('CDG','PARIS CHARLES DE GAULLE','AF BA LH DL AA EK SQ CX NH TK UA','K L M',4,'DEPARTS · DEPARTURES'),
$A('FCO','ROMA FIUMICINO','AZ BA LH AF EK TK UA DL SQ QR','D E F G',5,'PARTENZE · DEPARTURES'),
$A('IST','ISTANBUL HAVALIMANI','TK LH BA AF EK QR SQ UA DL KL','A D E F',6,'KALKIŞLAR · DEPARTURES'),
$A('MUC','MUENCHEN F.J. STRAUSS','LH UA TK EK SQ BA AF NH CX DL','G H K',7,'ABFLUG · DEPARTURES'),
$A('ZRH','ZUERICH KLOTEN','LX LH BA EK SQ TK UA AF NH','A B D E',8,'ABFLUG · DEPARTURES'),
$A('MAD','MADRID BARAJAS','IB BA LH AF AA EK TK UA DL SQ','H J K S',9,'SALIDAS · DEPARTURES'),
$A('BCN','BARCELONA EL PRAT','VY IB BA LH AF EK TK UA','A B C D',35,'SALIDAS · DEPARTURES'),
$A('LIS','LISBON PORTELA','TP BA LH AF EK TK SQ UA','1 2',36,'PARTIDAS · DEPARTURES'),
$A('VIE','VIENNA SCHWECHAT','OS LH BA TK EK SQ UA AF','D F G',37,'ABFLUG · DEPARTURES'),
$A('BRU','BRUSSELS ZAVENTEM','SN LH BA AF TK EK UA DL','A B',38,'VERTREK · DEPARTURES'),
$A('CPH','COPENHAGEN KASTRUP','SK LH BA AF TK EK SQ UA NH','A B C',39,'AFGANGE · DEPARTURES'),
$A('OSL','OSLO GARDERMOEN','SK LH BA AF TK EK DL UA','D E F',40,'AVGANGER · DEPARTURES'),
$A('ARN','STOCKHOLM ARLANDA','SK LH BA AF TK EK SQ UA','2 5',41,'AVGÅNGAR · DEPARTURES'),
$A('HEL','HELSINKI VANTAA','AY LH BA AF TK EK SQ NH','2',42,'LÄHDÖT · DEPARTURES'),
$A('DUB','DUBLIN','EI BA LH AF TK EK AA UA DL','1 2',43),
$A('MAN','MANCHESTER','BA TK EK SQ','1 2 3',44),
$A('EDI','EDINBURGH','BA TK EK','G H',45),
$A('WAW','WARSAW CHOPIN','LO LH BA AF TK EK UA SQ','A B',46,'ODLOTY · DEPARTURES'),
$A('PRG','PRAGUE VACLAV HAVEL','OK LH BA AF TK EK SQ UA','1 2 C D',47,'ODLETY · DEPARTURES'),
$A('BUD','BUDAPEST LISZT FERENC','W6 TK EK','A B',48,'INDULÁS · DEPARTURES'),
$A('ATH','ATHENS ELEFTHERIOS','A3 LH BA AF TK EK SQ UA','A B',49,'ΑΝΑΧΩΡΗΣΕΙΣ · DEPARTURES'),
/* ── MIDDLE EAST ── */
$A('DXB','DUBAI INTERNATIONAL','EK FZ QR BA LH SQ CX QF AF TK NH','A B C D',10,'DEPARTURES · المغادرة'),
$A('DOH','HAMAD INTERNATIONAL','QR BA LH EK TK SQ CX AF NH UA','A B C D',11,'DEPARTURES · المغادرة'),
$A('AUH','ABU DHABI INTL','EY BA AF TK SQ','A B C',50,'DEPARTURES · المغادرة'),
$A('JED','JEDDAH K.A.AZIZ','SV EK QR TK BA','N S',51,'DEPARTURES · المغادرة'),
/* ── AFRICA ── */
$A('CAI','CAIRO INTERNATIONAL','MS EK QR TK BA LH AF','1 2 3',52),
$A('NBO','NAIROBI JKIA','KQ EK QR TK BA ET','1 2',53),
$A('JNB','JOHANNESBURG O.R. TAMBO','SA EK QR BA LH AF TK SQ','A B',54),
$A('CMN','CASABLANCA MOHAMMED V','AT EK QR TK AF BA','1 2',55),
$A('ADD','ADDIS ABABA BOLE','ET EK TK QR','1 2',56),
$A('LOS','LAGOS MURTALA MUHAMMED','W3 EK QR TK BA ET','D E',57),
/* ── ASIA ── */
$A('HND','TOKYO HANEDA  羽田空港','NH JL AA DL UA BA LH AF SQ CX TK EK QF','',12,'出発 · DEPARTURES'),
$A('NRT','TOKYO NARITA  成田空港','JL NH AA DL UA BA LH AF SQ CX TK EK','1 2 3',13,'出発 · DEPARTURES'),
$A('PEK','BEIJING CAPITAL  北京首都','CA CZ MU NH JL BA LH AF EK SQ TK UA DL','D E T',14,'出发 · DEPARTURES'),
$A('PVG','SHANGHAI PUDONG  上海浦東','MU CA CZ NH JL BA LH AF EK SQ TK','1 2',58,'出发 · DEPARTURES'),
$A('CAN','GUANGZHOU BAIYUN  广州白云','CZ CA MU SQ TK EK BA NH JL','A B',59,'出发 · DEPARTURES'),
$A('HKG','HONG KONG INTL  香港國際','CX HX BA SQ NH JL QF EK TK LH UA AA','',15,'離港 · DEPARTURES'),
$A('ICN','SEOUL INCHEON  인천국제','KE OZ NH JL CX SQ UA DL AA LH TK EK','A B C',16,'출발 · DEPARTURES'),
$A('SIN','SINGAPORE CHANGI','SQ BA QF NH JL CX EK LH AF UA TK KE','A B C D',17),
$A('BKK','SUVARNABHUMI  สุวรรณภูมิ','TG SQ CX NH JL EK BA LH QR KE QF','C D E F G',18),
$A('DEL','INDIRA GANDHI INTL','AI UK SQ EK BA LH TK QR NH AF UA','T3',19,'DEPARTURES · प्रस्थान'),
$A('KUL','KUALA LUMPUR INTL','MH AK SQ CX EK BA LH TK QR','C J',60),
$A('CGK','JAKARTA SOEKARNO-HATTA','GA SQ CX EK BA LH TK QR NH','D E F',61),
$A('MNL','MANILA NINOY AQUINO','PR SQ CX EK BA NH JL KE','1 3',62),
$A('TPE','TAIWAN TAOYUAN  桃園國際','CI BR NH JL SQ CX EK BA LH UA','A B D',63,'出境 · DEPARTURES'),
$A('KIX','OSAKA KANSAI  関西空港','JL NH SQ CX KE OZ EK TK BA LH','1 2',64,'出発 · DEPARTURES'),
$A('CTS','SAPPORO NEW CHITOSE  新千歳','NH JL','',65,'出発 · DEPARTURES'),
$A('SGN','HO CHI MINH TAN SON NHAT','VN SQ CX EK BA TK QR NH JL KE','1 2',66),
$A('CCU','KOLKATA NETAJI SUBHAS','AI SQ EK','T1 T2',67),
/* ── AMERICAS ── */
$A('JFK','NEW YORK J.F. KENNEDY','AA DL UA JL BA EK SQ LH AF CX TK QR NH','A B C',20),
$A('EWR','NEWARK LIBERTY INTL','UA DL AA JL BA EK SQ LH AF TK NH','A B C',21),
$A('LAX','LOS ANGELES INTL','UA AA DL SQ CX QF NH JL BA EK LH AF TK','B T',22),
$A('ORD','CHICAGO O\'HARE','UA AA DL BA LH NH JL TK EK AF SQ','B C H K',23),
$A('ATL','ATLANTA HARTSFIELD','DL AA UA BA LH AF TK EK SQ','A B C D E F',68),
$A('SFO','SAN FRANCISCO INTL','UA AA DL SQ CX NH JL BA EK LH','A G',69),
$A('MIA','MIAMI INTERNATIONAL','AA DL UA BA LH AF IB EK TK','D E F G H J',70),
$A('DFW','DALLAS FORT WORTH','AA DL UA BA QR EK','A B C D E',71),
$A('IAH','HOUSTON G. BUSH','UA DL AA BA LH EK TK','A B C D E',72),
$A('SEA','SEATTLE-TACOMA','DL UA AA NH SQ','A B C D N S',73),
$A('DEN','DENVER INTERNATIONAL','UA DL AA LH','A B C',74),
$A('BOS','BOSTON LOGAN','DL UA AA JL BA EK LH AF TK','A B C E',75),
$A('YYZ','TORONTO PEARSON','AC WS AA UA DL BA LH AF TK EK NH SQ','D E F',24,'DEPARTURES · DEPARTS'),
$A('MEX','MEXICO CITY INTL','AM UA AA DL BA LH AF IB TK','1 2',25,'SALIDAS · DEPARTURES'),
$A('GRU','SAO PAULO GUARULHOS','LA G3 AA DL UA AF BA LH EK TK IB','D E',26,'PARTIDAS · DEPARTURES'),
$A('EZE','BUENOS AIRES EZEIZA','AR LA AA DL UA BA AF IB EK','A B C',76),
$A('BOG','BOGOTA EL DORADO','AV LA AA DL UA AF IB TK','1',77),
$A('SCL','SANTIAGO A.M. BENITEZ','LA AA AF IB','',78,'SALIDAS · DEPARTURES'),
$A('LIM','LIMA JORGE CHAVEZ','LA AV AA DL UA IB','',79),
$A('CUN','CANCUN INTERNATIONAL','AM UA AA DL BA','1 2 3 4',80),
/* ── OCEANIA ── */
$A('SYD','SYDNEY KINGSFORD SMITH','QF VA SQ EK CX NH BA UA AA DL LH NZ','A B C',27),
$A('MEL','MELBOURNE TULLAMARINE','QF VA SQ EK CX UA','1 2',81),
$A('AKL','AUCKLAND','NZ QF VA SQ EK','',82),
$A('PER','PERTH','QF VA SQ EK','1 2',83),
];

/* ═══ AIRPORT TIMEZONES ═══ */
const TZ={
/* Europe */
FRA:'Europe/Berlin',LHR:'Europe/London',AMS:'Europe/Amsterdam',CDG:'Europe/Paris',
FCO:'Europe/Rome',IST:'Europe/Istanbul',MUC:'Europe/Berlin',ZRH:'Europe/Zurich',
MAD:'Europe/Madrid',BCN:'Europe/Madrid',LIS:'Europe/Lisbon',VIE:'Europe/Vienna',
BRU:'Europe/Brussels',CPH:'Europe/Copenhagen',OSL:'Europe/Oslo',ARN:'Europe/Stockholm',
HEL:'Europe/Helsinki',DUB:'Europe/Dublin',MAN:'Europe/London',EDI:'Europe/London',
WAW:'Europe/Warsaw',PRG:'Europe/Prague',BUD:'Europe/Budapest',ATH:'Europe/Athens',
/* Middle East */
DXB:'Asia/Dubai',DOH:'Asia/Qatar',AUH:'Asia/Dubai',JED:'Asia/Riyadh',
/* Africa */
CAI:'Africa/Cairo',NBO:'Africa/Nairobi',JNB:'Africa/Johannesburg',
CMN:'Africa/Casablanca',ADD:'Africa/Addis_Ababa',LOS:'Africa/Lagos',
/* Asia */
HND:'Asia/Tokyo',NRT:'Asia/Tokyo',PEK:'Asia/Shanghai',PVG:'Asia/Shanghai',
CAN:'Asia/Shanghai',HKG:'Asia/Hong_Kong',ICN:'Asia/Seoul',SIN:'Asia/Singapore',
BKK:'Asia/Bangkok',DEL:'Asia/Kolkata',KUL:'Asia/Kuala_Lumpur',CGK:'Asia/Jakarta',
MNL:'Asia/Manila',TPE:'Asia/Taipei',KIX:'Asia/Tokyo',CTS:'Asia/Tokyo',
SGN:'Asia/Ho_Chi_Minh',CCU:'Asia/Kolkata',
/* Americas */
JFK:'America/New_York',EWR:'America/New_York',LAX:'America/Los_Angeles',
ORD:'America/Chicago',ATL:'America/New_York',SFO:'America/Los_Angeles',
MIA:'America/New_York',DFW:'America/Chicago',IAH:'America/Chicago',
SEA:'America/Los_Angeles',DEN:'America/Denver',BOS:'America/New_York',
YYZ:'America/Toronto',MEX:'America/Mexico_City',GRU:'America/Sao_Paulo',
EZE:'America/Argentina/Buenos_Aires',BOG:'America/Bogota',SCL:'America/Santiago',
LIM:'America/Lima',CUN:'America/Cancun',
/* Oceania */
SYD:'Australia/Sydney',MEL:'Australia/Melbourne',AKL:'Pacific/Auckland',
PER:'Australia/Perth',
};

/* ═══ AIRLINE ROUTE NETWORKS ═══ */
function $N(h,d){return{h:h.split(' '),d:d.split(' ')}}
const NET={
LH:$N('FRA MUC','LHR CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH OSL ARN HEL DUB WAW PRG BUD ATH DXB DOH CAI JNB NBO ADD NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL JFK EWR LAX ORD ATL SFO MIA DFW IAH SEA DEN BOS YYZ MEX GRU EZE BOG SYD BER HAM DUS GVA NCE OTP TLV MCT BAH RUH KWI MAA BLR SGN CTU TPE'),
BA:$N('LHR','FRA CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH HEL DUB MAN EDI WAW PRG ATH DXB DOH CAI JNB NBO ADD NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL JFK EWR LAX ORD ATL MIA DFW BOS YYZ MEX GRU EZE SYD BER MXP TLV RUH JED AUH'),
AF:$N('CDG','LHR FRA AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH OSL HEL DUB WAW PRG ATH DXB DOH CAI JNB NBO ADD CMN NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL JFK LAX ORD ATL MIA SFO YYZ MEX GRU EZE BOG SCL NCE MXP BER TLV'),
KL:$N('AMS','LHR FRA CDG FCO IST MAD BCN LIS VIE BRU CPH OSL ARN HEL DUB WAW PRG BUD ATH DXB DOH CAI JNB NBO NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL CGK JFK LAX ORD ATL SFO MIA IAH YYZ MEX GRU EZE BOG SYD'),
TK:$N('IST','LHR FRA CDG AMS FCO ZRH MAD BCN LIS VIE BRU CPH OSL ARN HEL DUB MAN WAW PRG BUD ATH DXB DOH CAI JNB NBO ADD CMN LOS NRT HND PEK PVG CAN HKG ICN SIN BKK DEL BOM KUL CGK MNL TPE JFK EWR LAX ORD ATL SFO MIA DFW IAH BOS YYZ MEX GRU EZE BOG SCL LIM SYD ADB TLV RUH JED AUH MCT BAH KWI MAA BLR HAN SGN CTU SZX'),
EK:$N('DXB','LHR FRA CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH OSL ARN HEL DUB MAN WAW PRG BUD ATH DOH CAI JNB NBO ADD CMN LOS NRT HND PEK PVG CAN HKG ICN SIN BKK DEL BOM KUL CGK MNL TPE KIX JFK EWR LAX ORD ATL SFO MIA DFW IAH SEA DEN BOS YYZ MEX GRU EZE BOG SYD MEL AKL PER MXP BER GVA NCE TLV RUH JED AUH MCT BAH KWI MAA BLR HAN SGN CTU SZX CMB MLE HKT DPS'),
QR:$N('DOH','LHR FRA CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH ARN HEL ATH DXB CAI JNB NBO ADD LOS NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL CGK MNL TPE JFK LAX ORD MIA DFW IAH BOS YYZ GRU SYD MEL AKL MXP BER TLV RUH JED AUH MCT BAH KWI MAA BLR SGN CMB MLE DPS'),
SQ:$N('SIN','LHR FRA CDG AMS FCO IST ZRH CPH MAN DXB DOH NRT HND PEK PVG CAN HKG ICN BKK DEL BOM KUL CGK MNL TPE KIX JFK LAX ORD SFO SEA YYZ SYD MEL AKL PER MXP GVA MAA BLR SGN HAN CTU SZX CMB MLE HKT DPS'),
CX:$N('HKG','LHR FRA AMS CDG DXB DOH NRT HND PEK PVG ICN SIN BKK DEL BOM KUL CGK MNL TPE KIX JFK LAX ORD SFO SEA BOS YYZ SYD MEL AKL PER MXP SGN HAN CTU SZX DPS'),
NH:$N('HND NRT','LHR FRA CDG AMS MUC ZRH DXB DOH PEK PVG HKG ICN SIN BKK DEL KUL CGK MNL TPE KIX CTS JFK LAX ORD SFO SEA IAH YYZ MEX SYD HAN SGN'),
JL:$N('HND NRT','LHR CDG FRA DXB PEK PVG HKG ICN SIN BKK DEL KUL MNL TPE KIX CTS JFK LAX ORD BOS SFO SEA SYD'),
AA:$N('DFW ORD JFK MIA LAX','LHR CDG FRA MAD BCN NRT HND HKG ICN PEK PVG SIN BKK DEL DXB DOH SYD GRU EZE BOG SCL LIM MEX CUN YYZ EWR ATL SFO IAH SEA DEN BOS PHL MSP DTW CLT PHX MCO SAN PDX YVR YUL HAV PTY'),
DL:$N('ATL JFK LAX SEA','LHR CDG FRA AMS FCO IST MUC DXB NRT HND PEK PVG HKG ICN SIN BKK SYD GRU EZE BOG MEX CUN YYZ ORD MIA DFW IAH DEN BOS SFO EWR PHL MSP DTW CLT PHX MCO SAN PDX YVR YUL HAV PTY'),
UA:$N('ORD EWR SFO IAH LAX DEN','LHR FRA CDG AMS FCO IST MUC ZRH DXB DOH NRT HND PEK PVG HKG ICN SIN BKK DEL SYD MEL GRU EZE BOG MEX CUN YYZ ATL MIA DFW SEA BOS JFK PHL MSP DTW CLT PHX MCO SAN PDX YVR YUL'),
QF:$N('SYD MEL','LHR DXB SIN HKG NRT HND BKK DEL JFK LAX SFO AKL PER DPS'),
KE:$N('ICN','LHR FRA CDG AMS FCO IST DXB NRT HND PEK PVG CAN HKG SIN BKK DEL KUL CGK MNL TPE KIX JFK LAX ORD ATL SFO SEA YYZ SYD MEL GRU SGN HAN'),
OZ:$N('ICN','FRA LHR CDG IST DXB NRT HND PEK PVG CAN HKG SIN BKK KUL MNL TPE KIX JFK LAX SFO SEA SYD SGN HAN'),
CA:$N('PEK','LHR FRA CDG AMS FCO IST ZRH DXB NRT HND HKG ICN SIN BKK DEL BOM KUL PVG CAN CTU SZX JFK LAX SFO ORD YYZ SYD MEL GRU MXP GVA'),
MU:$N('PVG','LHR FRA CDG AMS FCO IST DXB NRT HND HKG ICN SIN BKK DEL BOM KUL CGK PEK CAN CTU SZX JFK LAX SFO ORD SYD MEL MXP'),
CZ:$N('CAN','LHR FRA CDG AMS FCO IST DXB NRT HKG ICN SIN BKK DEL BOM KUL CGK PEK PVG CTU SZX JFK LAX SYD MEL NBO ADD'),
TG:$N('BKK','LHR FRA CDG AMS DXB NRT HND PEK PVG HKG ICN SIN DEL BOM KUL CGK MNL TPE KIX JFK LAX SYD MEL AKL MAA BLR SGN HAN CMB MLE HKT DPS'),
MH:$N('KUL','LHR DXB DOH IST NRT HND PEK PVG HKG ICN SIN BKK DEL BOM CGK MNL TPE SYD MEL AKL SGN HAN CMB MLE HKT DPS'),
GA:$N('CGK','SIN KUL BKK HKG NRT HND PEK PVG ICN AMS DXB SYD MEL DPS SGN'),
CI:$N('TPE','LHR FRA AMS DXB NRT HND PEK PVG HKG ICN SIN BKK KUL CGK MNL KIX JFK LAX SFO SYD MEL AKL SGN HAN'),
BR:$N('TPE','LHR FRA NRT HND PEK PVG HKG ICN SIN BKK KUL MNL KIX JFK LAX SFO SYD'),
VN:$N('SGN HAN','LHR FRA CDG NRT HND PEK PVG HKG ICN SIN BKK KUL DEL SYD MEL'),
PR:$N('MNL','SIN HKG NRT HND PEK PVG ICN BKK KUL DXB DOH JFK LAX SFO SYD'),
AI:$N('DEL BOM','LHR FRA CDG AMS SIN HKG NRT HND BKK KUL DXB DOH JFK EWR ORD SFO YYZ SYD MEL CCU MAA BLR CMB MLE'),
ET:$N('ADD','LHR FRA CDG IST DXB DOH CAI JNB NBO LOS NRT HND PEK PVG HKG SIN BKK DEL BOM KUL JFK LAX ORD YYZ GRU'),
SA:$N('JNB','LHR FRA CAI NBO ADD CMN LOS'),
EY:$N('AUH','LHR FRA CDG AMS FCO IST ZRH DXB NRT HND PEK PVG HKG ICN SIN BKK DEL BOM KUL CGK JFK LAX ORD SYD MEL MXP'),
SV:$N('JED RUH','LHR FRA CDG IST CAI DXB DOH AUH KWI BAH DEL BOM KUL SIN BKK CGK'),
FZ:$N('DXB','LHR AMS IST CAI JNB NBO CMN DEL BOM KUL SIN BKK CGK MNL'),
LX:$N('ZRH','LHR FRA CDG AMS FCO IST MAD BCN LIS VIE BRU CPH DUB ATH DXB DOH CAI NRT HND PEK PVG HKG SIN BKK DEL JFK LAX SFO ORD YYZ GRU SYD MXP BER GVA'),
IB:$N('MAD BCN','LHR FRA CDG AMS FCO IST LIS DXB DOH NRT PEK PVG HKG JFK MIA ORD LAX MEX GRU EZE BOG SCL LIM CUN'),
SK:$N('CPH OSL ARN','LHR FRA CDG AMS FCO IST ZRH MAD LIS VIE BRU HEL DUB WAW PRG ATH NRT PEK SIN BKK JFK ORD'),
AY:$N('HEL','LHR FRA CDG AMS FCO IST ZRH MAD LIS VIE BRU CPH OSL ARN DUB WAW PRG ATH DXB DOH NRT HND PEK PVG HKG SIN BKK DEL JFK ORD SFO'),
OS:$N('VIE','LHR FRA CDG AMS FCO IST ZRH MAD BCN LIS BRU CPH DUB WAW PRG BUD ATH DXB DOH CAI NRT PEK PVG'),
TP:$N('LIS','LHR FRA CDG AMS FCO MAD BCN VIE BRU CPH DUB ATH DXB DOH CAI JNB NBO ADD CMN JFK EWR ORD MIA GRU EZE BOG SCL'),
VY:$N('BCN','LHR FRA CDG AMS FCO MAD LIS VIE BRU CPH DUB ATH'),
SN:$N('BRU','LHR FRA CDG AMS FCO IST MAD BCN LIS VIE CPH DUB WAW PRG ATH DXB DOH CAI JNB NBO ADD'),
EI:$N('DUB','LHR FRA CDG AMS FCO IST MAD BCN LIS VIE BRU CPH JFK EWR BOS ORD'),
LO:$N('WAW','LHR FRA CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH DUB PRG BUD ATH DXB DOH CAI NRT PEK PVG'),
OK:$N('PRG','LHR FRA CDG AMS FCO IST ZRH MAD BCN VIE BRU CPH DUB WAW BUD ATH DXB DOH'),
W6:$N('BUD','LHR FRA CDG AMS FCO IST MAD BCN LIS VIE BRU CPH DUB WAW PRG ATH DXB'),
A3:$N('ATH','LHR FRA CDG AMS FCO IST ZRH MAD BCN LIS VIE BRU CPH DUB WAW PRG BUD DXB DOH CAI'),
MS:$N('CAI','LHR FRA CDG AMS FCO IST MAD ATH DXB DOH JNB NBO JED RUH KWI NRT SIN BKK JFK'),
KQ:$N('NBO','LHR FRA CDG AMS IST DXB DOH JNB ADD LOS CAI CMN DEL BOM BKK'),
AT:$N('CMN','LHR FRA CDG AMS FCO IST MAD BCN LIS BRU DXB DOH CAI JFK ORD YYZ GRU'),
W3:$N('LOS','LHR FRA CDG AMS IST DXB DOH JNB NBO ADD CAI'),
AC:$N('YYZ YUL','LHR FRA CDG AMS FCO IST ZRH DXB DOH NRT HND PEK PVG HKG ICN SIN BKK DEL JFK LAX SFO ORD MIA SEA DEN BOS EWR MEX GRU EZE BOG SYD MEL'),
AM:$N('MEX','LHR FRA CDG MAD BCN NRT PEK PVG JFK LAX ORD MIA DFW IAH SFO GRU EZE BOG SCL LIM CUN HAV PTY'),
LA:$N('SCL GRU','LHR FRA CDG MAD BCN FCO NRT PEK PVG SYD MEL AKL JFK LAX MIA ORD MEX EZE BOG LIM CUN'),
G3:$N('GRU','LHR FRA CDG MAD MIA JFK ORD EZE BOG SCL LIM MEX'),
AR:$N('EZE','LHR FRA CDG MAD BCN FCO MIA JFK GRU SCL BOG LIM MEX'),
AV:$N('BOG','LHR FRA MAD JFK MIA LAX GRU EZE SCL LIM MEX CUN'),
WS:$N('YYZ YVR YUL','LHR FRA CDG AMS DXB NRT HND JFK LAX ORD MIA SFO SEA DEN BOS MEX CUN'),
VS:$N('LHR','JFK LAX SFO ORD MIA IAH SEA BOS ATL DFW DEN JNB'),
VA:$N('SYD MEL','AKL PER DPS'),
NZ:$N('AKL','LHR SIN HKG NRT BKK SYD MEL PER JFK LAX SFO'),
AK:$N('KUL','SIN BKK CGK MNL TPE DPS HKT CMB'),
UK:$N('DEL BOM','SIN DXB LHR BKK HKG MAA BLR CCU CMB'),
HX:$N('HKG','NRT HND PEK PVG CAN ICN SIN BKK KUL CGK MNL TPE'),
AZ:$N('FCO MXP','LHR FRA CDG AMS IST MAD BCN LIS VIE BRU ATH DXB CAI NRT HND JFK LAX MIA ORD GRU EZE'),
XQ:$N('IST ADB','FRA MUC DUS HAM BER AMS LHR CDG'),
};

/* DS_MAP for O(1) lookup by IATA code */
const DS_MAP={};DS.forEach(d=>{DS_MAP[d[1]]=d});
/* Cell dimension cache — set once after first layout, reused by flip engine */
let CELL_W=0,CELL_H=0;

/* Same-metro airport pairs — no flights between these */
const SAME_METRO={
  'JFK':['EWR'],'EWR':['JFK'],
  'HND':['NRT'],'NRT':['HND']
};

/* Build route pool for an airport: returns [[airline, destination],...] */
const _routeCache={};
function getRoutes(ap){
  if(_routeCache[ap.c])return _routeCache[ap.c];
  const routes=[];
  ap.al.forEach(al=>{
    const net=NET[al];
    if(!net){
      DS.forEach(d=>{if(d[1]!==ap.c&&fnHash(d[1].charCodeAt(0),al.charCodeAt(0))%6===0)routes.push([al,d])});
      return;
    }
    const isHub=net.h.includes(ap.c);
    if(isHub){
      net.d.forEach(code=>{
        if(code!==ap.c){const ds=DS_MAP[code];if(ds)routes.push([al,ds])}
      });
    }else{
      /* Non-hub: only fly to this airline's hub(s) — no phantom spoke-spoke routes */
      net.h.forEach(hc=>{
        if(hc!==ap.c){const ds=DS_MAP[hc];if(ds)routes.push([al,ds])}
      });
    }
  });
  /* Filter same-metro absurdities (e.g. EWR↔JFK, HND↔NRT) */
  const excl=SAME_METRO[ap.c];
  if(excl){
    for(let i=routes.length-1;i>=0;i--){
      if(excl.includes(routes[i][1][1])) routes.splice(i,1);
    }
  }
  /* Deterministic shuffle to avoid duplicate clusters */
  for(let i=routes.length-1;i>0;i--){
    const j=fnHash(i,ap.sd)%(i+1);
    const tmp=routes[i];routes[i]=routes[j];routes[j]=tmp;
  }
  _routeCache[ap.c]=routes;
  return routes;
}

/* ═══ FLIGHT GENERATION ═══ */
function p2(n){return n.toString().padStart(2,'0')}

/* Multiplicative hash for flight number variety */
function fnHash(i,seed){
  let h=((i+1)*2654435761+(seed+1)*2246822519)>>>0;
  h=((h>>>16)^h)*0x45d9f3b>>>0;
  return h;
}

/* Airline flight number ranges — [min, max] matching real numbering conventions */
const FN_RNG={
LH:[100,4800],BA:[1,2600],AF:[1,3800],KL:[400,2800],
TK:[1,1980],EK:[1,680],QR:[1,780],SQ:[1,960],
CX:[200,880],NH:[1,980],JL:[1,780],AA:[1,2800],
DL:[1,2800],UA:[1,2500],QF:[1,880],KE:[1,960],
OZ:[100,980],CA:[100,1950],MU:[500,5800],CZ:[300,3800],
TG:[300,2800],MH:[1,780],GA:[200,980],CI:[1,960],
BR:[1,780],VN:[300,1950],PR:[100,880],AI:[100,980],
ET:[100,780],SA:[200,780],EY:[1,680],SV:[100,1950],
FZ:[1,980],LX:[1,1980],IB:[100,3680],SK:[100,980],
AY:[1,980],OS:[1,980],TP:[200,1950],VY:[1000,6500],
SN:[1,3800],EI:[100,980],LO:[1,780],OK:[100,780],
W6:[2000,9800],A3:[100,680],MS:[100,780],KQ:[100,780],
AT:[200,980],W3:[100,580],AC:[1,980],AM:[1,980],
LA:[600,1950],G3:[1000,2980],AR:[1100,1980],AV:[1,980],
WS:[1,980],VS:[1,460],VA:[1,980],NZ:[1,960],
AK:[300,1980],UK:[300,980],HX:[200,880],AZ:[100,680],
XQ:[100,980],
};

/* Famous real flight numbers: 'AL:FROM:TO' → flight number */
const FAMOUS={
'LH:FRA:JFK':400,'LH:FRA:EWR':410,'LH:FRA:ORD':430,'LH:FRA:LAX':450,
'LH:FRA:SFO':454,'LH:FRA:MIA':460,'LH:FRA:IAH':440,'LH:FRA:NRT':710,
'LH:FRA:HND':716,'LH:FRA:PEK':720,'LH:FRA:PVG':728,'LH:FRA:HKG':796,
'LH:FRA:SIN':778,'LH:FRA:BKK':772,'LH:FRA:DEL':760,'LH:FRA:BOM':764,
'LH:FRA:GRU':502,'LH:FRA:EZE':510,'LH:FRA:DXB':630,'LH:FRA:DOH':640,
'LH:FRA:JNB':572,'LH:FRA:SYD':790,'LH:FRA:ICN':712,
'LH:MUC:JFK':414,'LH:MUC:ORD':434,'LH:MUC:LAX':452,
'BA:LHR:JFK':1,'BA:LHR:LAX':269,'BA:LHR:SFO':285,'BA:LHR:ORD':295,
'BA:LHR:MIA':209,'BA:LHR:BOS':213,'BA:LHR:DFW':193,
'BA:LHR:NRT':5,'BA:LHR:HND':7,'BA:LHR:HKG':27,'BA:LHR:SIN':11,
'BA:LHR:BKK':9,'BA:LHR:DEL':257,'BA:LHR:SYD':15,'BA:LHR:PEK':39,
'BA:LHR:DXB':107,'BA:LHR:DOH':125,'BA:LHR:JNB':55,'BA:LHR:GRU':247,
'AF:CDG:JFK':1,'AF:CDG:LAX':66,'AF:CDG:NRT':275,'AF:CDG:HKG':188,
'AF:CDG:SIN':256,'AF:CDG:PEK':128,'AF:CDG:GRU':456,'AF:CDG:DXB':662,
'EK:DXB:LHR':1,'EK:DXB:JFK':201,'EK:DXB:LAX':215,'EK:DXB:SFO':225,
'EK:DXB:SYD':412,'EK:DXB:NRT':318,'EK:DXB:HKG':384,'EK:DXB:SIN':354,
'EK:DXB:BKK':372,'EK:DXB:CDG':71,'EK:DXB:FRA':45,'EK:DXB:AMS':91,
'EK:DXB:FCO':95,'EK:DXB:GRU':261,'EK:DXB:ORD':235,
'QR:DOH:LHR':1,'QR:DOH:JFK':701,'QR:DOH:LAX':739,'QR:DOH:CDG':39,
'SQ:SIN:LHR':308,'SQ:SIN:JFK':22,'SQ:SIN:LAX':37,'SQ:SIN:SFO':1,
'SQ:SIN:NRT':638,'SQ:SIN:HKG':856,'SQ:SIN:SYD':211,'SQ:SIN:FRA':326,
'CX:HKG:LHR':251,'CX:HKG:JFK':840,'CX:HKG:LAX':880,'CX:HKG:SIN':715,
'CX:HKG:NRT':500,'CX:HKG:SYD':101,'CX:HKG:BKK':701,
'NH:NRT:JFK':10,'NH:NRT:LAX':6,'NH:NRT:ORD':12,'NH:NRT:SFO':8,
'NH:HND:LHR':211,'NH:HND:FRA':223,'NH:HND:CDG':215,'NH:HND:SIN':843,
'JL:NRT:JFK':4,'JL:NRT:LAX':62,'JL:NRT:ORD':10,'JL:NRT:LHR':41,
'JL:HND:LHR':43,'JL:HND:CDG':45,'JL:HND:SIN':35,'JL:HND:BKK':31,
'AA:JFK:LHR':100,'AA:DFW:LHR':50,'AA:MIA:LHR':56,'AA:LAX:NRT':169,
'AA:DFW:NRT':175,'AA:JFK:NRT':153,'AA:ORD:LHR':86,
'DL:ATL:LHR':1,'DL:JFK:LHR':7,'DL:LAX:NRT':283,'DL:ATL:NRT':295,
'DL:JFK:CDG':264,'DL:ATL:CDG':78,'DL:JFK:AMS':46,
'UA:EWR:LHR':16,'UA:SFO:LHR':900,'UA:ORD:LHR':930,'UA:IAH:LHR':882,
'UA:SFO:NRT':837,'UA:SFO:SIN':15,'UA:SFO:HKG':877,'UA:SFO:PVG':857,
'QF:SYD:LHR':1,'QF:SYD:LAX':11,'QF:SYD:DFW':7,'QF:SYD:SIN':231,
'QF:MEL:LAX':93,'QF:SYD:HKG':127,'QF:SYD:NRT':21,
'KE:ICN:JFK':81,'KE:ICN:LAX':11,'KE:ICN:NRT':701,'KE:ICN:LHR':907,
'CA:PEK:JFK':981,'CA:PEK:LAX':983,'CA:PEK:LHR':937,'CA:PEK:FRA':931,
'TK:IST:JFK':1,'TK:IST:LAX':9,'TK:IST:LHR':1991,'TK:IST:CDG':1823,
'AC:YYZ:LHR':848,'AC:YYZ:FRA':872,'AC:YYZ:NRT':1,'AC:YYZ:HKG':15,
};

/* Generate flight number: famous DB → airline range → fallback */
function genFlightNum(i,seed,al,from,to,firstCycle){
  if(firstCycle){
    let famous=FAMOUS[al+':'+from+':'+to];
    if(famous!==undefined) return famous.toString().padStart(W_FN,' ');
    /* Reverse direction: conventional return flight = number + 1 */
    famous=FAMOUS[al+':'+to+':'+from];
    if(famous!==undefined) return (famous+1).toString().padStart(W_FN,' ');
  }
  const h=fnHash(i,seed);
  const rng=FN_RNG[al];
  if(rng){
    const num=rng[0]+h%(rng[1]-rng[0]+1);
    return num.toString().padStart(W_FN,' ');
  }
  return (1+h%9999).toString().padStart(W_FN,' ');
}

function genF(ap,count,arrMode,startMin){
  const now=new Date();
  const curTotal=now.getHours()*60+now.getMinutes();
  const linear=(startMin!==undefined);
  const routes=getRoutes(ap);
  if(!routes.length){/* Fallback if no routes */
    const pool=DS.filter(d=>d[1]!==ap.c);
    for(let i=0;i<count;i++){const hh=fnHash(i,ap.sd);routes.push([ap.al[hh%ap.al.length],pool[hh%pool.length]])}
  }
  const fl=[];

  /* Start time: linear from startMin, or ~1h before now */
  let t=linear?startMin:curTotal-55-(ap.sd%8)*2;
  if(!linear&&t<0)t+=1440;

  for(let i=0;i<count;i++){
    const hh=fnHash(i,ap.sd);

    /* Airline & destination — cycle through shuffled routes (no duplicates) */
    const route=routes[i%routes.length];
    const al=route[0];
    const dt=route[1];

    /* Round time to 5-min marks like real schedules */
    const rt=Math.round(t/5)*5;
    const hour=Math.floor(rt/60)%24;
    const min=rt%60;

    /* Gate: prefix + number */
    const gx=ap.gp.length?ap.gp[hh%ap.gp.length]:'';
    const gn=(1+hh%60).toString();

    /* Flight number — famous on first cycle, airline-range on repeats */
    const fnFrom=arrMode?dt[1]:ap.c, fnTo=arrMode?ap.c:dt[1];
    const fn=genFlightNum(i,ap.sd,al,fnFrom,fnTo,i<routes.length);

    /* Status based on time proximity to now */
    let diff=t-curTotal;
    if(!linear){if(diff>720)diff-=1440;if(diff<-720)diff+=1440}

    let s;
    if(arrMode){
      /* ── Arrival statuses ── */
      if(diff<-15)       s='LANDED';
      else if(diff<-5)   s=(hh%7===0)?'DELAYED':'LANDED';
      else if(diff<=0)   s='LANDED';
      else if(diff<=10)  s='ARRIVING';
      else if(diff<=25)  s=(hh%4===0)?'ON TIME':'EXPECTED';
      else if(diff<=60)  s=(hh%6===0)?'EXPECTED':'ON TIME';
      else               s=(hh%18===0)?'DELAYED':'ON TIME';
      if(s!=='LANDED'&&hh%67===0) s='CANCELLED';
    }else{
      /* ── Departure statuses ── */
      if(diff<-20)       s='DEPARTED';
      else if(diff<-10)  s=(hh%7===0)?'DELAYED':'DEPARTED';
      else if(diff<=-3)  s=(hh%5===0)?'LAST CALL':'BOARDING';
      else if(diff<=0)   s='BOARDING';
      else if(diff<=12)  s=(hh%3===0)?'GATE OPEN':'BOARDING';
      else if(diff<=30)  s=(hh%4===0)?'ON TIME':'GATE OPEN';
      else if(diff<=60)  s=(hh%6===0)?'GATE OPEN':'ON TIME';
      else               s=(hh%18===0)?'DELAYED':'ON TIME';
      if(s!=='DEPARTED'&&hh%67===0) s='CANCELLED';
    }

    fl.push({
      al:al.padEnd(W_AL).substring(0,W_AL),
      fn:fn.substring(0,W_FN),
      ds:dt[0].substring(0,W_DS).padEnd(W_DS),
      tm:p2(hour)+':'+p2(min),
      gt:(gx+gn).substring(0,W_GT).padEnd(W_GT),
      st:s.padEnd(W_ST).substring(0,W_ST),
      sr:s.trim(),
      _t:rt
    });

    /* Variable interval: peak hours = denser flights */
    const isPeak=(hour>=6&&hour<=9)||(hour>=16&&hour<=19);
    const isNight=hour>=23||hour<5;
    const base=isPeak?3:isNight?8:5;
    t+=base+(fnHash(i*3+5,ap.sd+7)%(base+2));
    if(!linear&&t>=1440)t-=1440;
  }
  return fl;
}

const EMPTY={al:'  ',fn:'    ',ds:'              ',tm:'     ',gt:'    ',st:'         ',sr:''};

function fChars(fl){
  const c=[];
  for(let i=0;i<W_AL;i++)c.push(fl.al[i]||' ');
  for(let i=0;i<W_FN;i++)c.push(fl.fn[i]||' ');
  for(let i=0;i<W_DS;i++)c.push(fl.ds[i]||' ');
  for(let i=0;i<W_TM;i++)c.push(fl.tm[i]||' ');
  for(let i=0;i<W_GT;i++)c.push(fl.gt[i]||' ');
  for(let i=0;i<W_ST;i++)c.push(fl.st[i]||' ');
  return c;
}
