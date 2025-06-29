import {
  Section,
  Text,
  Heading,
  Button,
  Img,
  Row,
  Column,
  Link,
  Hr,
} from '@react-email/components';
import EmailLayout from './EmailLayout';

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prepTime: number;
  antiInflammatoryScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mealType: string[];
}

interface HealthTip {
  title: string;
  content: string;
  icon: string;
  source?: string;
}

interface NewsletterEmailProps {
  user: {
    fullName?: string;
    email: string;
  };
  week: number;
  year: number;
  featuredRecipes: Recipe[];
  healthTips: HealthTip[];
  personalizedContent?: {
    weeklyStats?: {
      menusGenerated: number;
      avgAntiInflammatoryScore: number;
      favoriteIngredient: string;
    };
    recommendations?: string[];
  };
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';

const difficultyLabels = {
  easy: 'Facile',
  medium: 'Modéré',
  hard: 'Difficile'
};

const formatDate = (week: number, year: number) => {
  const date = new Date(year, 0, 1 + (week - 1) * 7);
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

export const NewsletterEmail = ({
  user,
  week,
  year,
  featuredRecipes,
  healthTips,
  personalizedContent,
  unsubscribeUrl,
  webviewUrl,
}: NewsletterEmailProps) => {
  const firstName = user.fullName?.split(' ')[0] || '';
  const weekDate = formatDate(week, year);

  return (
    <EmailLayout
      preview={`Newsletter NutriCoach - Semaine ${week} : Nouvelles recettes anti-inflammatoires et conseils nutrition personnalisés`}
      user={user}
      unsubscribeUrl={unsubscribeUrl}
      webviewUrl={webviewUrl}
    >
      {/* Header */}
      <Section className="text-center mb-8">
        <Heading className="text-3xl font-bold text-gray-900 mb-2">
          🌿 Newsletter NutriCoach
        </Heading>
        <Text className="text-lg text-gray-600 mb-1">
          Semaine {week} • {weekDate}
        </Text>
        <Text className="text-gray-600">
          Bonjour {firstName}, voici votre dose hebdomadaire de nutrition et bien-être !
        </Text>
      </Section>

      {/* Personalized Stats (if available) */}
      {personalizedContent?.weeklyStats && (
        <Section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
          <Heading className="text-xl font-semibold text-gray-900 mb-4 text-center">
            📊 Vos statistiques de la semaine
          </Heading>
          <Row>
            <Column className="w-1/3 text-center">
              <Text className="text-2xl font-bold text-green-600">
                {personalizedContent.weeklyStats.menusGenerated}
              </Text>
              <Text className="text-sm text-gray-700">
                Menus générés
              </Text>
            </Column>
            <Column className="w-1/3 text-center">
              <Text className="text-2xl font-bold text-blue-600">
                {personalizedContent.weeklyStats.avgAntiInflammatoryScore.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-700">
                Score anti-inflammatoire moyen
              </Text>
            </Column>
            <Column className="w-1/3 text-center">
              <Text className="text-lg font-semibold text-green-700">
                {personalizedContent.weeklyStats.favoriteIngredient}
              </Text>
              <Text className="text-sm text-gray-700">
                Ingrédient favori
              </Text>
            </Column>
          </Row>
        </Section>
      )}

      {/* Featured Recipes */}
      <Section className="mb-8">
        <Heading className="text-2xl font-semibold text-gray-900 mb-6">
          🍽️ Recettes de la semaine
        </Heading>
        <Text className="text-gray-700 mb-6">
          Découvrez notre sélection de recettes anti-inflammatoires, parfaites pour 
          booster votre santé tout en vous régalant.
        </Text>

        {featuredRecipes.map((recipe, index) => (
          <Row key={recipe.id} className="mb-6">
            <Column className="w-1/3 pr-4">
              <Img
                src={recipe.imageUrl}
                width="180"
                height="120"
                alt={recipe.title}
                className="rounded-lg w-full"
              />
            </Column>
            <Column className="w-2/3">
              <Heading className="text-lg font-semibold text-gray-900 mb-2">
                {recipe.title}
              </Heading>
              <Text className="text-gray-700 text-sm mb-3">
                {recipe.description}
              </Text>
              
              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="text-xs text-gray-600">
                    ⏱️ {recipe.prepTime} min
                  </Text>
                </Column>
                <Column className="w-1/3">
                  <Text className="text-xs text-gray-600">
                    📊 {difficultyLabels[recipe.difficulty]}
                  </Text>
                </Column>
                <Column className="w-1/3">
                  <Text className="text-xs text-green-600 font-medium">
                    🌿 {recipe.antiInflammatoryScore}/10
                  </Text>
                </Column>
              </Row>
              
              <Button
                className="bg-green-600 rounded text-white text-sm py-2 px-4"
                href={`${baseUrl}/recipes/${recipe.id}`}
              >
                Voir la recette
              </Button>
            </Column>
          </Row>
        ))}

        <Section className="text-center mt-6">
          <Button
            className="bg-white border border-green-600 rounded-lg text-green-600 font-medium py-2 px-6"
            href={`${baseUrl}/recipes`}
          >
            Découvrir toutes les recettes
          </Button>
        </Section>
      </Section>

      <Hr className="border-gray-300 my-8" />

      {/* Health Tips */}
      <Section className="mb-8">
        <Heading className="text-2xl font-semibold text-gray-900 mb-6">
          💡 Conseils nutrition de la semaine
        </Heading>
        
        {healthTips.map((tip, index) => (
          <Section key={index} className="bg-blue-50 rounded-lg p-4 mb-4">
            <Row>
              <Column className="w-12">
                <Text className="text-2xl">{tip.icon}</Text>
              </Column>
              <Column>
                <Heading className="text-lg font-semibold text-blue-900 mb-2">
                  {tip.title}
                </Heading>
                <Text className="text-blue-800 mb-2">
                  {tip.content}
                </Text>
                {tip.source && (
                  <Text className="text-xs text-blue-600 italic">
                    Source : {tip.source}
                  </Text>
                )}
              </Column>
            </Row>
          </Section>
        ))}
      </Section>

      <Hr className="border-gray-300 my-8" />

      {/* Personalized Recommendations */}
      {personalizedContent?.recommendations && (
        <Section className="mb-8">
          <Heading className="text-2xl font-semibold text-gray-900 mb-4">
            🎯 Recommandations personnalisées
          </Heading>
          <Text className="text-gray-700 mb-4">
            Basées sur votre profil et vos habitudes alimentaires :
          </Text>
          
          {personalizedContent.recommendations.map((recommendation, index) => (
            <Row key={index} className="mb-3">
              <Column className="w-6">
                <Text className="text-green-600 font-semibold">•</Text>
              </Column>
              <Column>
                <Text className="text-gray-700">{recommendation}</Text>
              </Column>
            </Row>
          ))}
          
          <Section className="text-center mt-6">
            <Button
              className="bg-green-600 rounded-lg text-white font-medium py-2 px-6"
              href={`${baseUrl}/menu/generate`}
            >
              Générer un nouveau menu
            </Button>
          </Section>
        </Section>
      )}

      {/* Seasonal Focus */}
      <Section className="bg-orange-50 rounded-lg p-6 mb-8">
        <Heading className="text-xl font-semibold text-orange-900 mb-4">
          🍂 Focus saisonnier
        </Heading>
        <Text className="text-orange-800 mb-4">
          En cette saison, privilégiez les aliments riches en vitamine D et en antioxydants 
          pour renforcer votre système immunitaire.
        </Text>
        
        <Row>
          <Column className="w-1/4 text-center">
            <Img
              src={`${baseUrl}/images/email/seasonal/pumpkin.png`}
              width="60"
              height="60"
              alt="Courge"
              className="mx-auto mb-2 rounded-lg"
            />
            <Text className="text-sm text-orange-800">Courges</Text>
          </Column>
          <Column className="w-1/4 text-center">
            <Img
              src={`${baseUrl}/images/email/seasonal/spinach.png`}
              width="60"
              height="60"
              alt="Épinards"
              className="mx-auto mb-2 rounded-lg"
            />
            <Text className="text-sm text-orange-800">Épinards</Text>
          </Column>
          <Column className="w-1/4 text-center">
            <Img
              src={`${baseUrl}/images/email/seasonal/walnuts.png`}
              width="60"
              height="60"
              alt="Noix"
              className="mx-auto mb-2 rounded-lg"
            />
            <Text className="text-sm text-orange-800">Noix</Text>
          </Column>
          <Column className="w-1/4 text-center">
            <Img
              src={`${baseUrl}/images/email/seasonal/salmon.png`}
              width="60"
              height="60"
              alt="Saumon"
              className="mx-auto mb-2 rounded-lg"
            />
            <Text className="text-sm text-orange-800">Poissons gras</Text>
          </Column>
        </Row>
      </Section>

      {/* Community Spotlight */}
      <Section className="mb-8">
        <Heading className="text-xl font-semibold text-gray-900 mb-4">
          👥 À la une de la communauté
        </Heading>
        
        <Section className="border border-gray-200 rounded-lg p-4 mb-4">
          <Row>
            <Column className="w-16">
              <Img
                src={`${baseUrl}/images/email/avatars/user-1.png`}
                width="50"
                height="50"
                alt="Sophie M."
                className="rounded-full"
              />
            </Column>
            <Column>
              <Text className="font-medium text-gray-900 mb-1">Sophie M.</Text>
              <Text className="text-gray-700 text-sm mb-2">
                "Grâce à NutriCoach, j'ai réduit mes inflammations articulaires de 60% 
                en 3 mois ! Les recettes sont délicieuses et faciles à préparer."
              </Text>
              <Text className="text-xs text-gray-600">⭐⭐⭐⭐⭐ Il y a 2 jours</Text>
            </Column>
          </Row>
        </Section>
        
        <Section className="text-center">
          <Link
            href={`${baseUrl}/community`}
            className="text-green-600 font-medium"
          >
            Rejoindre la communauté →
          </Link>
        </Section>
      </Section>

      {/* Quick Actions */}
      <Section className="bg-gray-50 rounded-lg p-6 mb-8">
        <Heading className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Actions rapides
        </Heading>
        
        <Row>
          <Column className="w-1/3 text-center pr-2">
            <Button
              className="bg-green-600 rounded-lg text-white font-medium py-2 px-3 w-full text-sm"
              href={`${baseUrl}/menu/generate`}
            >
              Nouveau menu
            </Button>
          </Column>
          <Column className="w-1/3 text-center px-1">
            <Button
              className="bg-blue-600 rounded-lg text-white font-medium py-2 px-3 w-full text-sm"
              href={`${baseUrl}/recipes/favorites`}
            >
              Mes favoris
            </Button>
          </Column>
          <Column className="w-1/3 text-center pl-2">
            <Button
              className="bg-purple-600 rounded-lg text-white font-medium py-2 px-3 w-full text-sm"
              href={`${baseUrl}/profile`}
            >
              Mon profil
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Footer CTA */}
      <Section className="text-center mb-6">
        <Text className="text-gray-700 mb-4">
          Vous aimez NutriCoach ? Partagez-le avec vos proches !
        </Text>
        <Button
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-semibold py-3 px-6"
          href={`${baseUrl}/referral`}
        >
          Parrainer un ami
        </Button>
        <Text className="text-sm text-gray-600 mt-2">
          Vous et votre ami recevrez 1 mois gratuit !
        </Text>
      </Section>

      {/* Next Newsletter Preview */}
      <Section className="border border-gray-200 rounded-lg p-4 mb-6">
        <Text className="text-sm text-gray-600 mb-1">La semaine prochaine :</Text>
        <Text className="text-gray-900 font-medium mb-2">
          🎃 Spécial automne : 5 recettes aux courges anti-inflammatoires
        </Text>
        <Text className="text-xs text-gray-600">
          + Interview exclusive d'un nutritionniste spécialisé en alimentation anti-inflammatoire
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default NewsletterEmail;