/* The real ECP roster, used to seed the users collection.
 *
 * This file is Node only. It is never imported by the app and therefore
 * never reaches the browser bundle, which matters because it carries
 * members' email addresses.
 *
 * Sources, all supplied by the club:
 *   - "ECP MEMBERS DATABASE WITH YR JOIN.xlsx", sheet "ECP LIST"
 *     ("Directory of ECP Members 2026") for who is a member, their email
 *     and the date they joined.
 *   - The same workbook's first sheet for profession and Lagos connection,
 *     matched on first and last name only. Its POSITION column is an older
 *     executive and is deliberately not used.
 *   - The Member Spotlight badge artwork for each person's name and current
 *     office, which is what /about already publishes.
 *   - "Bims Bio 2026.docx" and "Hon. Abdullateef.pptx" for two biographies;
 *     the Mimiko and Onitolo biographies are the ones already on /about.
 *
 * Deliberately absent: home addresses, phone numbers and dates of birth.
 * The workbook holds all three and none of them are needed by anything the
 * site renders, so they are not seeded.
 *
 * Five people have no email on file. They are seeded on the reserved
 * .invalid TLD, which can never route, so nothing can accidentally mail
 * them and the admin screen can show that no address is known.
 *
 * `joinedAt` is an empty string where the club's sheet does not record a
 * joining date. The UI reads that as unknown and prints N/A.
 */

const NO_EMAIL = (slug) => `${slug}@members.ekoclubphiladelphia.invalid`;

export const MEMBERS = [
  {
    slug: "olabisi-dabiri-okoya",
    displayName: "Hon. Olabisi Dabiri-Okoya",
    firstName: "Olabisi",
    lastName: "Dabiri-Okoya",
    email: "24bisiokoya@gmail.com",
    joinedAt: "2004-08-10",
    title: "President",
    office: "exco",
    occupation: "Teacher",
    lga: "Lagos Island",
    photo: "olabisi-dabiri-okoya",
  },
  {
    slug: "bola-okoya",
    displayName: "Hon. Bola Okoya",
    firstName: "Bola",
    lastName: "Okoya",
    email: "bollaokoya@gmail.com",
    joinedAt: "2004-08-10",
    title: "Chairman, Board of Trustees",
    office: "trustees",
    occupation: "Accountant and financial consultant",
    lga: "Lagos Island",
    photo: "bola-okoya",
  },
  {
    slug: "patricia-abiggs",
    displayName: "Hon. Patricia Abiggs",
    firstName: "Patricia",
    lastName: "Abiggs",
    email: "patriciaabiggs25@gmail.com",
    joinedAt: "2014-10-18",
    title: "Member",
    photo: "patricia-abiggs",
  },
  {
    slug: "funmi-ayantuga",
    displayName: "Hon. Funmi Ayantuga",
    firstName: "Funmi",
    lastName: "Ayantuga",
    email: "funmayan@gmail.com",
    joinedAt: "2015-01-17",
    title: "Member",
  },
  {
    slug: "victoria-arowolo",
    displayName: "Hon. Victoria Arowolo",
    firstName: "Victoria",
    lastName: "Arowolo",
    email: "vickkirachae4sure@yahoo.com",
    joinedAt: "2015-05-23",
    title: "Member",
    lga: "Lagos Island",
    photo: "victoria-arowolo",
  },
  {
    slug: "abolore-olufemi",
    displayName: "Hon. Abolore Olufemi",
    firstName: "Abolore",
    lastName: "Olufemi",
    email: "talk_2abo@yahoo.com",
    joinedAt: "2016-03-19",
    title: "Member",
    lga: "Lagos Island",
  },
  {
    slug: "titilayo-balogun",
    displayName: "Hon. Titilayo Balogun",
    firstName: "Titilayo",
    lastName: "Balogun",
    email: "alimotbola1945@yahoo.com",
    joinedAt: "2016-06-18",
    title: "Member",
    lga: "Lagos Island",
    photo: "titilayo-balogun",
    bio: "Joined the club in June 2016 and rejoined in April 2022.",
  },
  {
    slug: "saheed-abdullateef",
    displayName: "Hon. Saheed Abdullateef",
    firstName: "Saheed",
    lastName: "Abdullateef",
    email: "omotolaone@gmail.com",
    joinedAt: "2017-03-18",
    title: "Secretary, Board of Trustees",
    office: "trustees",
    occupation: "Founder, McLati Logistics LLC",
    lga: "Lagos Island",
    photo: "saheed-abdullateef",
    bio: [
      "Hon. Saheed Omotola Abdullateef (SOA) is the owner and founder of McLati Logistics LLC, a professional transportation company based in Reading, Pennsylvania. The company specialises in the safe and reliable delivery of general freight, with a strong commitment to safety, efficiency and customer satisfaction.",
      "Alongside his professional work he has served in community and organisational leadership: former President of Eko Club Philadelphia, and former Chief Whip and Public Relations Officer of Eko Club International from 2019 to 2025.",
    ].join("\n\n"),
  },
  {
    slug: "olabisi-lawal",
    displayName: "Hon. Olabisi Lawal",
    firstName: "Olabisi",
    lastName: "Lawal",
    email: "lawaljemilat@yahoo.com",
    joinedAt: "2017-05-20",
    title: "Treasurer / Financial Secretary",
    office: "exco",
    occupation: "Social worker",
    lga: "Lagos Island",
    photo: "olabisi-lawal",
  },
  {
    slug: "simisoluwa-spruell",
    displayName: "Hon. Simisoluwa Spruell",
    firstName: "Simisoluwa",
    lastName: "Spruell",
    email: "thespruell@gmail.com",
    joinedAt: "2017-05-20",
    title: "Member",
    photo: "simisoluwa-spruell",
  },
  {
    slug: "bolanle-bello",
    displayName: "Hon. Bolanle Bello",
    firstName: "Bolanle",
    lastName: "Bello",
    email: "mutiatbamgbala@yahoo.com",
    joinedAt: "2017-07-22",
    title: "Member",
    photo: "bolanle-bello",
  },
  {
    slug: "bintu-paseda",
    displayName: "Hon. Bintu Paseda",
    firstName: "Bintu",
    lastName: "Paseda",
    email: "bpaseda@yahoo.com",
    joinedAt: "2017-11-18",
    title: "Member",
    photo: "bintu-paseda",
  },
  {
    slug: "wale-lawal",
    displayName: "Hon. Wale Lawal",
    firstName: "Wale",
    lastName: "Lawal",
    email: "rgafar32@gmail.com",
    joinedAt: "2018-01-20",
    title: "Member",
    photo: "wale-lawal",
  },
  {
    slug: "folashade-adedeji",
    displayName: "Hon. Folashade Adedeji",
    firstName: "Folashade",
    lastName: "Adedeji",
    email: "folasadetella12@gmail.com",
    joinedAt: "2022-04-08",
    title: "PRO / Social Secretary",
    office: "exco",
    photo: "folashade-adedeji",
  },
  {
    slug: "monsurat-suleiman",
    displayName: "Hon. Monsurat Suleiman",
    firstName: "Monsurat",
    lastName: "Suleiman",
    email: "khasmeen006@gmail.com",
    joinedAt: "2023-06-25",
    title: "Member",
    photo: "monsurat-suleiman",
  },
  {
    slug: "folashade-small",
    displayName: "Hon. Folashade Small",
    firstName: "Folashade",
    lastName: "Small",
    email: "sisimiventures@gmail.com",
    joinedAt: "2023-07-11",
    title: "Member",
    photo: "folashade-small",
  },
  {
    slug: "adebimpe-daniells",
    displayName: "Hon. Adebimpe Daniells",
    firstName: "Adebimpe",
    lastName: "Daniells",
    email: "bimsbaby@gmail.com",
    joinedAt: "2023-11-20",
    title: "Vice President",
    office: "exco",
    occupation: "Senior Solutions Architect, AWS",
    photo: "adebimpe-daniells",
    bio: [
      "Adebimpe Daniells is a technologist, author and speaker with deep expertise in cloud computing, AI and machine learning, and digital transformation. As a Senior Solutions Architect and AI specialist for Private Equity at AWS, she advises leading PE firms on cloud migration, modernisation and AI driven value creation across their portfolio companies. She specialises in developing and implementing AI decision making strategies, helping organisations build and deploy production AI workloads on AWS.",
      "She authored the memoir Serendipity, was named one of the Society of Women Engineers’ “Women Engineers You Should Know 2024”, and received the Amazon Women in Engineering Technology Innovator Award 2025. She is a member of Phi Beta Kappa and the Golden Key International Honour Society, and speaks at industry conferences including the SWE Conference, the George Mason Cloud Summit and the World AgriTech Summit.",
    ].join("\n\n"),
  },
  {
    slug: "modupe-mabinuori-olageshin",
    displayName: "Hon. Elder Modupe Mabinuori-Olageshin",
    firstName: "Modupe",
    lastName: "Mabinuori-Olageshin",
    email: "modupeolageshin@gmail.com",
    joinedAt: "2024-01-01",
    title: "Vice Chairwoman / Treasurer, Board of Trustees",
    office: "trustees",
    photo: "modupe-mabinuori-olageshin",
  },
  {
    slug: "adebimpe-badru-adenusi",
    displayName: "Hon. (Dr) Adebimpe Badru-Adenusi",
    firstName: "Adebimpe",
    lastName: "Badru-Adenusi",
    email: "bevigil2008@gmail.com",
    joinedAt: "2024-08-31",
    title: "Member",
    photo: "adebimpe-badru-adenusi",
  },
  {
    slug: "funmi-smith",
    displayName: "Hon. Funmi Smith",
    firstName: "Funmi",
    lastName: "Smith",
    email: "ebonywhy@gmail.com",
    joinedAt: "2024-09-17",
    title: "Member",
    photo: "funmi-smith",
  },
  {
    slug: "funmi-eregha",
    displayName: "Hon. Funmi Eregha",
    firstName: "Funmi",
    lastName: "Eregha",
    email: NO_EMAIL("funmi-eregha"),
    joinedAt: "",
    title: "Member",
    photo: "funmi-eregha",
  },
  {
    slug: "tj-abass",
    displayName: "Otunba TJ Abass",
    firstName: "TJ",
    lastName: "Abass",
    email: NO_EMAIL("tj-abass"),
    joinedAt: "",
    title: "Grand Patron",
    office: "patron",
    photo: "tj-abass",
  },
  {
    slug: "ganiyu-mimiko",
    displayName: "Dr. Ganiyu Mimiko",
    firstName: "Ganiyu",
    lastName: "Mimiko",
    email: NO_EMAIL("ganiyu-mimiko"),
    joinedAt: "2017-05-20",
    title: "Patron",
    office: "patron",
    occupation: "Project Manager, Connecticut Department of Transportation",
    photo: "ganiyu-mimiko",
    bio: [
      "Dr. Ganiyu Mimiko was born in Ondo City. He attended Ansar-Ud-Deen primary school, Okelisa from 1963 to 1969, Jubilee Secondary Modern School in 1970 and Independence Grammar School in 1971, before transferring to Ondo Boys High School where he completed his secondary education from 1972 to 1975.",
      "He worked with Monier Construction Company in Port Harcourt from 1975 to 1982 as Laboratory Technical Manager before leaving for the United States. He earned a BS in Civil Engineering from the University of the District of Columbia in 1988 and joined the Connecticut Department of Transportation in 1989, where he manages construction projects. He went on to an MS in Environmental Engineering from the University of New Haven in 1993 and a PhD in Engineering Management from National University in 2009.",
      "He is a former president of the Yoruba Community Club, a former president and current Treasurer of the Ondo Elite Club of Rhode Island, and serves on the Human Rights and Relations Commission in Hamden, Connecticut.",
    ].join("\n\n"),
  },
  {
    slug: "maryanne-onitolo",
    displayName: "Chief (Dr.) Maryanne Onitolo",
    firstName: "Maryanne",
    lastName: "Onitolo",
    email: NO_EMAIL("maryanne-onitolo"),
    joinedAt: "",
    title: "Matron",
    office: "patron",
    occupation: "Family Nurse Practitioner",
    photo: "maryanne-onitolo",
    bio: [
      "Maryanne Onitolo, MSN, FNP-BC, DNP, is a board certified Family Nurse Practitioner licensed in New York and New Jersey, and a graduate of Monmouth University in New Jersey.",
      "Known for her dedication, leadership and commitment to serving others, she is a mentor, leader and educator, and a proud mother of three children, all of whom have pursued careers in medicine. In recognition of her service she was honoured with the traditional chieftaincy title of Yeye Apesin of Ijora Kingdom, Lagos, by HRM Oba Fatai Aremu Aromire, the Ojora of Lagos. Outside work she enjoys cooking, decorating and spending time with her family.",
    ].join("\n\n"),
  },
  {
    slug: "risikat-oshilaja",
    displayName: "Alhaja Risikat Oshilaja",
    firstName: "Risikat",
    lastName: "Oshilaja",
    email: NO_EMAIL("risikat-oshilaja"),
    joinedAt: "",
    title: "Matron",
    office: "patron",
    photo: "risikat-oshilaja",
  },
];

/** Mock accounts to remove. The two login accounts are kept on purpose. */
export const KEEP_USER_IDS = ["u-member-001", "u-admin-001"];
