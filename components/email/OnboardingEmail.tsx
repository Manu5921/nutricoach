import {
  Section,
  Text,
  Heading,
  Button,
  Img,
  Row,
  Column,
  Link,
} from '@react-email/components';
import EmailLayout from './EmailLayout';

interface OnboardingEmailProps {
  user: {
    fullName?: string;
    email: string;
  };
  stepNumber: 1 | 2 | 3 | 4 | 5;
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';

const onboardingSteps = {
  1: {
    title: "Jour 1 : Complétez votre profil nutritionnel",
    emoji: "📝",
    mainContent: {
      heading: "Créons votre profil nutritionnel personnalisé",
      description: "Pour vous offrir les meilleures recommandations, nous avons besoin d'en savoir plus sur vos objectifs, préférences et contraintes alimentaires.",
      cta: "Compléter mon profil",
      ctaUrl: "/profile"
    },
    tips: [
      "Renseignez vos objectifs de santé (perte de poids, anti-inflammatoire, etc.)",
      "Indiquez vos allergies et intolérances alimentaires",
      "Précisez votre niveau d'activité physique"
    ],
    didYouKnow: "Saviez-vous qu'une alimentation anti-inflammatoire peut réduire les douleurs articulaires de 40% en moyenne ?"
  },
  2: {
    title: "Jour 3 : Générez votre premier menu IA",
    emoji: "🍽️",
    mainContent: {
      heading: "Découvrez la magie de la génération de menus IA",
      description: "Notre intelligence artificielle analyse vos préférences pour créer des menus équilibrés, savoureux et adaptés à vos besoins nutritionnels.",
      cta: "Générer mon menu",
      ctaUrl: "/menu/generate"
    },
    tips: [
      "Chaque menu est optimisé pour vos objectifs santé",
      "Les recettes privilégient les aliments anti-inflammatoires",
      "Vous pouvez régénérer autant de fois que vous le souhaitez"
    ],
    didYouKnow: "Notre IA analyse plus de 2000 ingrédients et leurs propriétés nutritionnelles pour créer vos menus parfaits."
  },
  3: {
    title: "Jour 7 : Explorez vos recettes personnalisées",
    emoji: "👨‍🍳",
    mainContent: {
      heading: "Cuisinez avec plaisir et santé",
      description: "Chaque recette NutriCoach est soigneusement sélectionnée pour ses bienfaits anti-inflammatoires et son goût exceptionnel.",
      cta: "Découvrir les recettes",
      ctaUrl: "/recipes"
    },
    tips: [
      "Filtrez par temps de préparation, difficulté et type de repas",
      "Consultez le score anti-inflammatoire de chaque recette",
      "Sauvegardez vos recettes favorites"
    ],
    didYouKnow: "Les épices comme le curcuma et le gingembre peuvent réduire l'inflammation de 25% selon des études récentes."
  },
  4: {
    title: "Jour 14 : Optimisez vos résultats",
    emoji: "📊",
    mainContent: {
      heading: "Suivez vos progrès nutritionnels",
      description: "Découvrez comment votre alimentation évolue et l'impact positif sur votre santé grâce à nos outils de suivi avancés.",
      cta: "Voir mon tableau de bord",
      ctaUrl: "/dashboard"
    },
    tips: [
      "Consultez vos statistiques nutritionnelles hebdomadaires",
      "Suivez votre score anti-inflammatoire global",
      "Identifiez les domaines d'amélioration"
    ],
    didYouKnow: "Les utilisateurs qui suivent régulièrement leurs progrès atteignent leurs objectifs 3x plus rapidement."
  },
  5: {
    title: "Jour 21 : Passez au niveau supérieur",
    emoji: "🚀",
    mainContent: {
      heading: "Débloquez tout le potentiel de NutriCoach",
      description: "Vous avez découvert les bases ! Maintenant, accédez à des fonctionnalités avancées pour accélérer votre transformation nutritionnelle.",
      cta: "Découvrir Premium",
      ctaUrl: "/pricing"
    },
    tips: [
      "Plans de repas hebdomadaires automatiques",
      "Analyses nutritionnelles approfondies",
      "Support prioritaire et coaching personnalisé"
    ],
    didYouKnow: "Les membres Premium perdent en moyenne 2x plus de poids et maintiennent leurs résultats plus longtemps."
  }
};

export const OnboardingEmail = ({
  user,
  stepNumber,
  unsubscribeUrl,
  webviewUrl,
}: OnboardingEmailProps) => {
  const firstName = user.fullName?.split(' ')[0] || '';
  const step = onboardingSteps[stepNumber];

  return (
    <EmailLayout
      preview={`${step.title} - Continuez votre parcours NutriCoach avec ${firstName}`}
      user={user}
      unsubscribeUrl={unsubscribeUrl}
      webviewUrl={webviewUrl}
    >
      {/* Progress Indicator */}
      <Section className="mb-8">
        <Row>
          <Column className="text-center">
            <Text className="text-sm text-gray-600 mb-2">
              Étape {stepNumber} sur 5 de votre parcours d'intégration
            </Text>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${(stepNumber / 5) * 100}%` }}
              ></div>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Header */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-2">{step.emoji}</Text>
        <Heading className="text-2xl font-bold text-gray-900 mb-2">
          {step.title}
        </Heading>
        <Text className="text-gray-600">
          Bonjour {firstName}, continuons votre transformation nutritionnelle !
        </Text>
      </Section>

      {/* Main Content */}
      <Section className="mb-8">
        <Heading className="text-xl font-semibold text-gray-900 mb-4">
          {step.mainContent.heading}
        </Heading>
        <Text className="text-gray-700 text-lg mb-6">
          {step.mainContent.description}
        </Text>
        
        <Section className="text-center mb-6">
          <Button
            className="bg-green-600 rounded-lg text-white font-semibold py-3 px-8 text-lg"
            href={`${baseUrl}${step.mainContent.ctaUrl}`}
          >
            {step.mainContent.cta}
          </Button>
        </Section>
      </Section>

      {/* Tips Section */}
      <Section className="bg-green-50 rounded-lg p-6 mb-8">
        <Heading className="text-lg font-semibold text-gray-900 mb-4">
          💡 Conseils pour cette étape
        </Heading>
        
        {step.tips.map((tip, index) => (
          <Row key={index} className="mb-3">
            <Column className="w-6">
              <Text className="text-green-600 font-semibold">•</Text>
            </Column>
            <Column>
              <Text className="text-gray-700">{tip}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* Did You Know */}
      <Section className="border-l-4 border-blue-500 pl-4 mb-8">
        <Heading className="text-lg font-semibold text-blue-900 mb-2">
          🧠 Le saviez-vous ?
        </Heading>
        <Text className="text-blue-800 italic">
          {step.didYouKnow}
        </Text>
      </Section>

      {/* Quick Actions for current step */}
      {stepNumber === 1 && (
        <Section className="bg-gray-50 rounded-lg p-6 mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            Actions rapides
          </Heading>
          <Row>
            <Column className="w-1/3 text-center pr-2">
              <Link href={`${baseUrl}/profile#health-goals`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/health-goals.png`}
                  width="40"
                  height="40"
                  alt="Objectifs santé"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-gray-700 font-medium">
                  Définir mes objectifs
                </Text>
              </Link>
            </Column>
            <Column className="w-1/3 text-center px-2">
              <Link href={`${baseUrl}/profile#dietary-preferences`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/dietary-prefs.png`}
                  width="40"
                  height="40"
                  alt="Préférences alimentaires"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-gray-700 font-medium">
                  Mes préférences
                </Text>
              </Link>
            </Column>
            <Column className="w-1/3 text-center pl-2">
              <Link href={`${baseUrl}/profile#allergies`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/allergies.png`}
                  width="40"
                  height="40"
                  alt="Allergies"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-gray-700 font-medium">
                  Allergies & intolérances
                </Text>
              </Link>
            </Column>
          </Row>
        </Section>
      )}

      {/* Recipe showcase for step 2 */}
      {stepNumber === 2 && (
        <Section className="mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            🍽️ Aperçu de votre premier menu
          </Heading>
          <Row className="mb-4">
            <Column className="w-1/3 text-center pr-2">
              <Img
                src={`${baseUrl}/images/email/recipes/breakfast-sample.jpg`}
                width="120"
                height="90"
                alt="Petit-déjeuner anti-inflammatoire"
                className="rounded-lg mx-auto mb-2"
              />
              <Text className="text-sm font-medium text-gray-900">Petit-déjeuner</Text>
              <Text className="text-xs text-green-600">Score AI: 8.5/10</Text>
            </Column>
            <Column className="w-1/3 text-center px-2">
              <Img
                src={`${baseUrl}/images/email/recipes/lunch-sample.jpg`}
                width="120"
                height="90"
                alt="Déjeuner équilibré"
                className="rounded-lg mx-auto mb-2"
              />
              <Text className="text-sm font-medium text-gray-900">Déjeuner</Text>
              <Text className="text-xs text-green-600">Score AI: 9.2/10</Text>
            </Column>
            <Column className="w-1/3 text-center pl-2">
              <Img
                src={`${baseUrl}/images/email/recipes/dinner-sample.jpg`}
                width="120"
                height="90"
                alt="Dîner anti-inflammatoire"
                className="rounded-lg mx-auto mb-2"
              />
              <Text className="text-sm font-medium text-gray-900">Dîner</Text>
              <Text className="text-xs text-green-600">Score AI: 8.8/10</Text>
            </Column>
          </Row>
        </Section>
      )}

      {/* Progress celebration for later steps */}
      {stepNumber >= 4 && (
        <Section className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mb-8 text-center">
          <Text className="text-2xl mb-2">🎉</Text>
          <Heading className="text-lg font-semibold text-gray-900 mb-2">
            Félicitations pour vos progrès !
          </Heading>
          <Text className="text-gray-700 mb-4">
            Vous êtes sur la bonne voie pour transformer votre alimentation. 
            Continuez comme ça !
          </Text>
          <Button
            className="bg-green-600 rounded-lg text-white font-medium py-2 px-6"
            href={`${baseUrl}/dashboard`}
          >
            Voir mes statistiques
          </Button>
        </Section>
      )}

      {/* Support */}
      <Section className="text-center mb-6">
        <Text className="text-gray-700 mb-4">
          Besoin d'aide pour cette étape ?
        </Text>
        <Row>
          <Column className="w-1/2 text-center">
            <Link
              href={`${baseUrl}/help/onboarding`}
              className="text-green-600 font-medium"
            >
              📚 Guide d'intégration
            </Link>
          </Column>
          <Column className="w-1/2 text-center">
            <Link
              href="mailto:support@nutricoach.app"
              className="text-green-600 font-medium"
            >
              💬 Contacter le support
            </Link>
          </Column>
        </Row>
      </Section>

      {/* Next step preview */}
      {stepNumber < 5 && (
        <Section className="border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 mb-1">Prochaine étape :</Text>
          <Text className="text-gray-900 font-medium">
            {onboardingSteps[stepNumber + 1 as keyof typeof onboardingSteps].title}
          </Text>
          <Text className="text-xs text-gray-600">
            Vous recevrez le prochain email dans quelques jours
          </Text>
        </Section>
      )}
    </EmailLayout>
  );
};

export default OnboardingEmail;