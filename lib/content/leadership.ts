// Shared with the public About page and the club assistant. Names and roles
// are the club-supplied public roster, not private member records.
const EKO_GREEN = "#059669", EKO_RED = "#dc2626", EKO_BLUE = "#2563eb", EKO_YELLOW = "#d97706";

export type Person = {
  name: string;
  role: string;
  image: string;
  /** Point down the SOURCE image, as a percentage, that the crop centres on. */
  focusY: number;
  color: string;
  bio?: string[];
  /**
   * A plain photograph, where the club has supplied one. When present the
   * card draws the badge live (see MemberBadge) instead of zooming into the
   * pre-made artwork, so the coloured rings and the medallion survive at
   * card size rather than being cropped away.
   */
  photo?: string;
  /** Where in `photo` the circular crop centres, as percentages. */
  photoFocusX?: number;
  photoFocusY?: number;
  /** The same person with the background removed, so the head can rise
      clear of the ring the way the printed badge has it. */
  cutout?: string;
};

export const EXCO_MEMBERS: Person[] = [
  {
    name: "Hon. Olabisi Dabiri-Okoya",
    role: "President",
    image: "/gallery/excos/olabisi-dabiri-okoya.png",
    photo: "/gallery/people/olabisi-dabiri-okoya.jpg",
    focusY: 26,
    color: EKO_GREEN,
  },
  {
    name: "Hon. Adebimpe Daniells",
    role: "Vice President",
    image: "/gallery/excos/adebimpe-daniells.png",
    photo: "/gallery/people/adebimpe-daniells.jpg",
    focusY: 26,
    color: EKO_RED,
  },
  {
    name: "Hon. Olabisi Lawal",
    role: "Treasurer / Financial Secretary",
    image: "/gallery/excos/olabisi-lawal.png",
    photo: "/gallery/people/olabisi-lawal.jpg",
    focusY: 37,
    color: EKO_BLUE,
  },
  {
    name: "Hon. Folashade Adedeji",
    role: "PRO / Social Secretary",
    image: "/gallery/excos/folashade-adedeji.png",
    photo: "/gallery/people/folashade-adedeji.jpg",
    focusY: 37,
    color: EKO_YELLOW,
  },
  {
    name: "Hon. Bola Okoya",
    role: "Chairman, Board of Trustees",
    image: "/gallery/excos/bola-okoya.png",
    photo: "/gallery/people/bola-okoya.jpg",
    focusY: 21,
    color: EKO_GREEN,
  },
  {
    name: "Hon. Elder Modupe Mabinuori-Olageshin",
    role: "Vice Chairwoman / Treasurer, Board of Trustees",
    image: "/gallery/excos/modupe-mabinuori-olageshin.png",
    photo: "/gallery/people/modupe-mabinuori-olageshin.jpg",
    focusY: 26,
    color: EKO_RED,
  },
  {
    name: "Hon. Saheed Abdullateef",
    role: "Secretary, Board of Trustees",
    image: "/gallery/excos/saheed-abdullateef.png",
    photo: "/gallery/people/saheed-abdullateef.jpg",
    focusY: 18,
    color: EKO_BLUE,
  },
];

export const PATRONS: Person[] = [
  {
    name: "Otunba TJ Abass",
    role: "Grand Patron",
    image: "/gallery/patrons/tj-abass.png",
    photo: "/gallery/people/tj-abass.jpg",
    focusY: 30,
    color: EKO_GREEN,
  },
  {
    name: "Dr. Ganiyu Mimiko",
    role: "Patron",
    image: "/gallery/patrons/ganiyu-mimiko.png",
    photo: "/gallery/people/ganiyu-mimiko.jpg",
    focusY: 30,
    color: EKO_BLUE,
    bio: [
      "Dr. Ganiyu Mimiko was born in Ondo City. He attended Ansar-Ud-Deen primary school, Okelisa from 1963 to 1969. He also attended Jubilee Secondary Modern School in 1970 and attended Independence Grammar School in 1971. He transferred to Ondo Boys High School (OHS) where he completed his secondary school from 1972 to 1975.",
      "Dr. Mimiko worked with Monier Construction Company (MCC) in Port Harcourt from 1975 to 1982 and was the Laboratory Technical Manager (Grade 1) before leaving for the United State America (USA). While in the USA, he attended the University of District of Columbia (UDC) and obtained his undergraduate (BS) diploma in Civil Engineering in 1988. He joined Connecticut Department of Transportation (CONNDOT) in 1989 till present. As a Project Manager, he oversees various aspects of construction projects. In his quest for more academic advancement, he attended University of New Haven (UNH) and obtained his graduate (MS) diploma in Environmental Engineering 1993. He bagged his doctoral (Ph.D.) degree in Engineering Management from National University in 2009.",
      "Dr. Mimiko received Certificate of Recognition from American Society of Civil Engineering (National Capital Section) in 1989. He received Certificate of Achievement from Government Institutes, Inc. Washington, DC. He was elected Affiliate Member by the American Society of Civil Engineering for the advancement of professional knowledge and the improvement of civil Engineering. In 2015, after the completion of his Pharmacy Technician Program, he was certified by Ashworth Career School Alpha of Georgia and was enlisted as a member of the International Honor society Delta Epsilon Tau.",
      "Dr. Mimiko is a former president of Yoruba Community Club (YCC). Also, he was a former president and currently the Treasurer of Ondo Elite Club (OEC) of Rhode Island. In addition, he is currently serving as a member of the Human Rights and Relations Commission in Hamden, CT.",
    ],
  },
  {
    name: "Chief (Dr.) Maryanne Onitolo",
    role: "Matron",
    image: "/gallery/patrons/maryanne-onitolo.png",
    photo: "/gallery/people/maryanne-onitolo.jpg",
    focusY: 30,
    color: EKO_RED,
    bio: [
      "Maryanne Onitolo, MSN, FNP-BC, DNP, is a board-certified Family Nurse Practitioner licensed in New York and New Jersey. She is a graduate from Monmouth University in New Jersey.",
      "Known for her dedication, leadership, and commitment to serving others, Maryanne is also a passionate mentor, leader and educator. She is a proud mother of three children, all of whom have pursued careers in medicine. In recognition of her service and leadership, she was honored with the traditional chieftaincy title of Yeye Apesin of Ijora Kingdom, Lagos, Nigeria (by HRM, Oba Fatai Aremu Aromire, the Ojora of Lagos). Outside of work, she enjoys cooking, decorating, and spending time with her family.",
    ],
  },
  {
    name: "Alhaja Risikat Oshilaja",
    role: "Matron",
    image: "/gallery/patrons/risikat-oshilaja.png",
    photo: "/gallery/people/risikat-oshilaja.jpg",
    focusY: 30,
    color: EKO_YELLOW,
  },
];
