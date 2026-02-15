export type InviteStatus = "invited" | "accepted" | "rejected";

export type InviteLite = {
  id: string;
  status: InviteStatus;
  creator: {
    name: string;
    avatarUrl: string;
    ig: string;
  };
};

export type TripActivity = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  dateLabel: string;
  locationLabel: string;
  notes: string;
  invites: InviteLite[];
};

const placeholderTrips: TripActivity[] = [
  {
    id: "cannes-sunrise-session",
    title: "Cannes Sunrise Session",
    subtitle: "Editorial + marina golden hour",
    coverUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
    dateLabel: "May 14, 7:00 AM",
    locationLabel: "Cannes Marina",
    notes: "Bring neutral looks and one swimwear option.",
    invites: [
      {
        id: "i1",
        status: "accepted",
        creator: {
          name: "Sofia Hart",
          avatarUrl: "https://i.pravatar.cc/100?img=11",
          ig: "@sofia.hart",
        },
      },
      {
        id: "i2",
        status: "accepted",
        creator: {
          name: "Mila Jones",
          avatarUrl: "https://i.pravatar.cc/100?img=21",
          ig: "@milajones",
        },
      },
      {
        id: "i3",
        status: "invited",
        creator: {
          name: "Amelia Rose",
          avatarUrl: "https://i.pravatar.cc/100?img=41",
          ig: "@ameliarose",
        },
      },
      {
        id: "i4",
        status: "rejected",
        creator: {
          name: "Clara Lynn",
          avatarUrl: "https://i.pravatar.cc/100?img=47",
          ig: "@claralynn",
        },
      },
    ],
  },
  {
    id: "monaco-rooftop-brunch",
    title: "Monaco Rooftop Brunch",
    subtitle: "Private terrace + lifestyle captures",
    coverUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    dateLabel: "May 15, 11:30 AM",
    locationLabel: "Hôtel de Paris, Monaco",
    notes: "White palette preferred. Meet at lobby 20 min before.",
    invites: [
      {
        id: "i5",
        status: "invited",
        creator: {
          name: "Nina Vale",
          avatarUrl: "https://i.pravatar.cc/100?img=32",
          ig: "@ninavale",
        },
      },
      {
        id: "i6",
        status: "invited",
        creator: {
          name: "Raya Kim",
          avatarUrl: "https://i.pravatar.cc/100?img=25",
          ig: "@rayakim",
        },
      },
      {
        id: "i7",
        status: "invited",
        creator: {
          name: "Lana Voss",
          avatarUrl: "https://i.pravatar.cc/100?img=18",
          ig: "@lana.voss",
        },
      },
      {
        id: "i8",
        status: "invited",
        creator: {
          name: "Tia Moss",
          avatarUrl: "https://i.pravatar.cc/100?img=15",
          ig: "@tiamoss",
        },
      },
      {
        id: "i9",
        status: "rejected",
        creator: {
          name: "Ivy Chase",
          avatarUrl: "https://i.pravatar.cc/100?img=56",
          ig: "@ivychase",
        },
      },
    ],
  },
  {
    id: "porto-cervo-sunset",
    title: "Porto Cervo Sunset",
    subtitle: "Yacht-side portraits & motion",
    coverUrl:
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80",
    dateLabel: "May 18, 6:45 PM",
    locationLabel: "Porto Cervo Harbour",
    notes: "Wind-ready styling and flat shoes for dock walk.",
    invites: [
      {
        id: "i10",
        status: "accepted",
        creator: {
          name: "Aria Bloom",
          avatarUrl: "https://i.pravatar.cc/100?img=37",
          ig: "@ariabloom",
        },
      },
      {
        id: "i11",
        status: "accepted",
        creator: {
          name: "Zoe Cruz",
          avatarUrl: "https://i.pravatar.cc/100?img=44",
          ig: "@zoecruz",
        },
      },
      {
        id: "i12",
        status: "accepted",
        creator: {
          name: "Kira Lane",
          avatarUrl: "https://i.pravatar.cc/100?img=12",
          ig: "@kiralane",
        },
      },
      {
        id: "i13",
        status: "accepted",
        creator: {
          name: "Mina Fox",
          avatarUrl: "https://i.pravatar.cc/100?img=28",
          ig: "@minafox",
        },
      },
      {
        id: "i14",
        status: "accepted",
        creator: {
          name: "Gia Rae",
          avatarUrl: "https://i.pravatar.cc/100?img=65",
          ig: "@giarae",
        },
      },
    ],
  },
];

export async function fetchTrips(): Promise<TripActivity[]> {
  return Promise.resolve(placeholderTrips);
}
