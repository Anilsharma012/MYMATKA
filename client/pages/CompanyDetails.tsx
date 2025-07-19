import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const CompanyDetails = () => {
  const navigate = useNavigate();
  const { gameName } = useParams();

  const gameDetails: { [key: string]: any } = {
    "delhi-bazar": {
      name: "Delhi Bazar",
      icon: "🦁",
      closeTime: "02:40 PM",
      resultTime: "03:15 PM",
    },
    "dubai-market": {
      name: "Dubai Market",
      icon: "🏢",
      closeTime: "04:10 PM",
      resultTime: "04:30 PM",
    },
    gali: {
      name: "Gali",
      icon: "⚔️",
      closeTime: "11:30 PM",
      resultTime: "12:00 AM",
    },
    disawer: {
      name: "Disawer",
      icon: "🎲",
      closeTime: "04:50 PM",
      resultTime: "05:05 PM",
    },
    faridabad: {
      name: "Faridabad",
      icon: "🏛️",
      closeTime: "05:40 PM",
      resultTime: "06:00 PM",
    },
    gaziabad: {
      name: "Gaziabad",
      icon: "🏗️",
      closeTime: "07:40 PM",
      resultTime: "08:00 PM",
    },
  };

  const game = gameDetails[gameName || "delhi-bazar"];

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/matka-games")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">
              Company details
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Game Info Card */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-foreground text-3xl font-bold mb-8">
              {game.name}
            </h2>

            {/* Game Icon */}
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-4xl">{game.icon}</span>
            </div>

            {/* Game Description */}
            <div className="space-y-6 mb-8">
              <div className="border-b border-border/30 pb-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Declares only one lucky number in a day that is same followed
                  by all our country
                </p>
              </div>

              <div className="border-b border-border/30 pb-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  You can win huge money by placing that on your lucky number
                </p>
              </div>

              <div className="border-b border-border/30 pb-4">
                <p className="text-muted-foreground text-lg">
                  Holiday, last day of month
                </p>
              </div>
            </div>

            {/* Game Timings */}
            <div className="bg-matka-dark/50 rounded-lg p-6 border border-matka-gold/30">
              <div className="flex justify-between items-center mb-3">
                <span className="text-muted-foreground">Game Close Time :</span>
                <span className="text-foreground font-semibold">
                  {game.closeTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Game Result Time :
                </span>
                <span className="text-foreground font-semibold">
                  {game.resultTime}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Play Button */}
        <div className="mt-8">
          <Button
            onClick={() => navigate(`/game/${gameName}`)}
            className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-4 text-lg rounded-xl hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
          >
            Play {game.name}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
