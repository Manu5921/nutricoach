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

interface ReminderEmailProps {
  user: {
    fullName?: string;
    email: string;
  };
  type: 'inactive_7_days' | 'inactive_14_days' | 'profile_incomplete' | 'trial_ending' | 'menu_suggestion' | 'weekly_checkin';
  personalizedData?: {
    lastActivity?: string;
    profileCompleteness?: number;
    trialDaysLeft?: number;
    suggestedRecipes?: Array<{
      id: string;
      title: string;
      imageUrl: string;
      antiInflammatoryScore: number;
    }>;
    weeklyProgress?: {
      menusGenerated: number;
      recipesViewed: number;
      avgScore: number;
    };
  };
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';

const reminderContent = {
  inactive_7_days: {
    subject: "On vous a manqué ! 🌱 Reprenez votre parcours nutrition",
    emoji: "👋",
    title: "Ça nous manque de ne pas vous voir !",
    mainMessage: "Il y a 7 jours que vous n'avez pas visité NutriCoach. Votre parcours nutrition vous attend !",
    cta: "Reprendre mon parcours",
    ctaUrl: "/dashboard",
    urgency: "low"
  },
  inactive_14_days: {
    subject: "⚠️ Votre transformation nutrition est en pause",
    emoji: "⏰",
    title: "Ne perdez pas vos progrès !",
    mainMessage: "Cela fait 2 semaines que vous n'avez pas utilisé NutriCoach. Vos habitudes nutritionnelles sont-elles toujours sur la bonne voie ?",
    cta: "Relancer ma transformation",
    ctaUrl: "/menu/generate",
    urgency: "medium"
  },
  profile_incomplete: {
    subject: "🎯 Complétez votre profil pour de meilleures recommandations",
    emoji: "📝",
    title: "Finalisez votre profil nutritionnel",
    mainMessage: "Votre profil est incomplet. Plus vous nous donnez d'informations, plus nos recommandations seront précises et efficaces.",
    cta: "Compléter mon profil",
    ctaUrl: "/profile",
    urgency: "low"
  },
  trial_ending: {
    subject: "⏳ Votre essai se termine bientôt - Ne perdez pas vos progrès !",
    emoji: "🚀",
    title: "Votre essai gratuit se termine bientôt",
    mainMessage: "Continuez votre transformation nutritionnelle sans interruption en passant à un abonnement premium.",
    cta: "Continuer avec Premium",
    ctaUrl: "/pricing",
    urgency: "high"
  },
  menu_suggestion: {
    subject: "🍽️ Votre menu personnalisé du jour vous attend !",
    emoji: "👨‍🍳",
    title: "Votre menu du jour est prêt !",
    mainMessage: "Découvrez les nouvelles recettes anti-inflammatoires que notre IA a sélectionnées spécialement pour vous.",
    cta: "Découvrir mon menu",
    ctaUrl: "/menu/generate",
    urgency: "low"
  },
  weekly_checkin: {
    subject: "📊 Votre bilan nutrition de la semaine",
    emoji: "📈",
    title: "Comment s'est passée votre semaine ?",
    mainMessage: "Faisons le point sur vos progrès nutritionnels et planifions la semaine prochaine ensemble.",
    cta: "Voir mon bilan",
    ctaUrl: "/dashboard",
    urgency: "low"
  }
};

export const ReminderEmail = ({
  user,
  type,
  personalizedData,
  unsubscribeUrl,
  webviewUrl,
}: ReminderEmailProps) => {
  const firstName = user.fullName?.split(' ')[0] || '';
  const content = reminderContent[type];
  
  return (
    <EmailLayout
      preview={`${content.subject} - ${firstName}, votre parcours nutrition vous attend !`}
      user={user}
      unsubscribeUrl={unsubscribeUrl}
      webviewUrl={webviewUrl}
    >
      {/* Header with urgency indicator */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-2">{content.emoji}</Text>
        <Heading className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </Heading>
        <Text className="text-gray-600">
          Bonjour {firstName} !
        </Text>
        
        {content.urgency === 'high' && (
          <Section className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 mx-auto max-w-md">
            <Text className="text-red-800 font-medium text-sm">
              ⚠️ Action requise rapidement
            </Text>
          </Section>
        )}
      </Section>

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-lg text-gray-700 text-center mb-6">
          {content.mainMessage}
        </Text>
        
        <Section className="text-center mb-6">
          <Button
            className={`${
              content.urgency === 'high' ? 'bg-red-600' : 'bg-green-600'
            } rounded-lg text-white font-semibold py-3 px-8 text-lg`}
            href={`${baseUrl}${content.ctaUrl}`}
          >
            {content.cta}
          </Button>
        </Section>
      </Section>

      {/* Type-specific content */}
      {type === 'inactive_7_days' && (
        <Section className="bg-blue-50 rounded-lg p-6 mb-8">
          <Heading className="text-lg font-semibold text-blue-900 mb-4">
            🎯 Reprendre là où vous vous êtes arrêté
          </Heading>
          <Row>
            <Column className="w-1/3 text-center pr-2">
              <Link href={`${baseUrl}/menu/generate`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/menu-generate.png`}
                  width="50"
                  height="50"
                  alt="Générer menu"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-blue-800 font-medium">
                  Nouveau menu
                </Text>
              </Link>
            </Column>
            <Column className="w-1/3 text-center px-1">
              <Link href={`${baseUrl}/recipes`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/recipes.png`}
                  width="50"
                  height="50"
                  alt="Recettes"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-blue-800 font-medium">
                  Recettes
                </Text>
              </Link>
            </Column>
            <Column className="w-1/3 text-center pl-2">
              <Link href={`${baseUrl}/dashboard`} className="block">
                <Img
                  src={`${baseUrl}/images/email/icons/dashboard.png`}
                  width="50"
                  height="50"
                  alt="Tableau de bord"
                  className="mx-auto mb-2"
                />
                <Text className="text-sm text-blue-800 font-medium">
                  Mes progrès
                </Text>
              </Link>
            </Column>
          </Row>
        </Section>
      )}

      {type === 'inactive_14_days' && (
        <Section className="mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            🔥 Relancez votre motivation
          </Heading>
          <Text className="text-gray-700 mb-4">
            Nous comprenons que maintenir de nouvelles habitudes peut être difficile. 
            Voici quelques moyens simples de reprendre :
          </Text>
          
          <Row className="mb-4">
            <Column className="w-8">
              <Text className="text-green-600 font-bold text-lg">1.</Text>
            </Column>
            <Column>
              <Text className="text-gray-700">
                <strong>Commencez petit</strong> : Générez juste un repas pour aujourd'hui
              </Text>
            </Column>
          </Row>
          
          <Row className="mb-4">
            <Column className="w-8">
              <Text className="text-green-600 font-bold text-lg">2.</Text>
            </Column>
            <Column>
              <Text className="text-gray-700">
                <strong>Redéfinissez vos objectifs</strong> : Ajustez vos préférences si nécessaire
              </Text>
            </Column>
          </Row>
          
          <Row className="mb-6">
            <Column className="w-8">
              <Text className="text-green-600 font-bold text-lg">3.</Text>
            </Column>
            <Column>
              <Text className="text-gray-700">
                <strong>Demandez de l'aide</strong> : Notre équipe est là pour vous accompagner
              </Text>
            </Column>
          </Row>
          
          <Section className="text-center">
            <Button
              className="bg-blue-600 rounded-lg text-white font-medium py-2 px-6"
              href="mailto:support@nutricoach.app"
            >
              Parler à un coach
            </Button>
          </Section>
        </Section>
      )}

      {type === 'profile_incomplete' && personalizedData?.profileCompleteness && (
        <Section className="mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            📊 Complétude de votre profil
          </Heading>
          
          <Section className="bg-gray-100 rounded-lg p-4 mb-4">
            <Row>
              <Column>
                <Text className="text-sm text-gray-600 mb-2">
                  Profil complété à {personalizedData.profileCompleteness}%
                </Text>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${personalizedData.profileCompleteness}%` }}
                  ></div>
                </div>
              </Column>
            </Row>
          </Section>
          
          <Text className="text-gray-700 mb-4">
            Sections à compléter pour de meilleures recommandations :
          </Text>
          
          <Row className="mb-3">
            <Column className="w-6">
              <Text className="text-orange-500">•</Text>
            </Column>
            <Column>
              <Link href={`${baseUrl}/profile#health-goals`} className="text-green-600">
                Objectifs de santé
              </Link>
            </Column>
          </Row>
          
          <Row className="mb-3">
            <Column className="w-6">
              <Text className="text-orange-500">•</Text>
            </Column>
            <Column>
              <Link href={`${baseUrl}/profile#dietary-preferences`} className="text-green-600">
                Préférences alimentaires détaillées
              </Link>
            </Column>
          </Row>
          
          <Row className="mb-6">
            <Column className="w-6">
              <Text className="text-orange-500">•</Text>
            </Column>
            <Column>
              <Link href={`${baseUrl}/profile#lifestyle`} className="text-green-600">
                Informations sur votre mode de vie
              </Link>
            </Column>
          </Row>
        </Section>
      )}

      {type === 'trial_ending' && personalizedData?.trialDaysLeft && (
        <Section className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6 mb-8">
          <Heading className="text-xl font-semibold text-red-900 mb-4 text-center">
            ⏰ Plus que {personalizedData.trialDaysLeft} jour{personalizedData.trialDaysLeft > 1 ? 's' : ''} !
          </Heading>
          
          <Text className="text-red-800 text-center mb-6">
            Ne perdez pas vos progrès et continuez votre transformation avec NutriCoach Premium.
          </Text>
          
          <Row className="mb-6">
            <Column className="w-1/3 text-center">
              <Text className="text-green-600 font-bold text-xl">♾️</Text>
              <Text className="text-sm text-gray-700">Menus illimités</Text>
            </Column>
            <Column className="w-1/3 text-center">
              <Text className="text-blue-600 font-bold text-xl">📊</Text>
              <Text className="text-sm text-gray-700">Analyses avancées</Text>
            </Column>
            <Column className="w-1/3 text-center">
              <Text className="text-purple-600 font-bold text-xl">🎯</Text>
              <Text className="text-sm text-gray-700">Coach personnel</Text>
            </Column>
          </Row>
          
          <Section className="text-center">
            <Button
              className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-semibold py-3 px-8"
              href={`${baseUrl}/pricing?code=TRIAL30`}
            >
              Passer à Premium (-30%)
            </Button>
            <Text className="text-xs text-red-700 mt-2">
              Offre limitée : 30% de réduction sur le premier mois
            </Text>
          </Section>
        </Section>
      )}

      {type === 'menu_suggestion' && personalizedData?.suggestedRecipes && (
        <Section className="mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            🍽️ Suggestions du jour
          </Heading>
          
          {personalizedData.suggestedRecipes.map((recipe, index) => (
            <Row key={recipe.id} className="mb-4">
              <Column className="w-20">
                <Img
                  src={recipe.imageUrl}
                  width="60"
                  height="45"
                  alt={recipe.title}
                  className="rounded"
                />
              </Column>
              <Column>
                <Text className="font-medium text-gray-900 text-sm mb-1">
                  {recipe.title}
                </Text>
                <Text className="text-xs text-green-600">
                  Score anti-inflammatoire : {recipe.antiInflammatoryScore}/10
                </Text>
              </Column>
              <Column className="w-20 text-right">
                <Button
                  className="bg-green-600 rounded text-white text-xs py-1 px-2"
                  href={`${baseUrl}/recipes/${recipe.id}`}
                >
                  Voir
                </Button>
              </Column>
            </Row>
          ))}
        </Section>
      )}

      {type === 'weekly_checkin' && personalizedData?.weeklyProgress && (
        <Section className="mb-8">
          <Heading className="text-lg font-semibold text-gray-900 mb-4">
            📈 Vos progrès cette semaine
          </Heading>
          
          <Section className="bg-green-50 rounded-lg p-4 mb-6">
            <Row>
              <Column className="w-1/3 text-center">
                <Text className="text-2xl font-bold text-green-600">
                  {personalizedData.weeklyProgress.menusGenerated}
                </Text>
                <Text className="text-sm text-green-700">Menus générés</Text>
              </Column>
              <Column className="w-1/3 text-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {personalizedData.weeklyProgress.recipesViewed}
                </Text>
                <Text className="text-sm text-blue-700">Recettes consultées</Text>
              </Column>
              <Column className="w-1/3 text-center">
                <Text className="text-2xl font-bold text-purple-600">
                  {personalizedData.weeklyProgress.avgScore.toFixed(1)}
                </Text>
                <Text className="text-sm text-purple-700">Score moyen AI</Text>
              </Column>
            </Row>
          </Section>
          
          <Text className="text-gray-700 text-center mb-6">
            {personalizedData.weeklyProgress.menusGenerated >= 5 
              ? "Excellent ! Vous êtes très actif cette semaine. Continuez comme ça !" 
              : "Vous pouvez faire encore mieux ! Essayez de générer au moins 5 menus par semaine."
            }
          </Text>
        </Section>
      )}

      {/* Motivational quote */}
      <Section className="border-l-4 border-green-500 pl-4 mb-8">
        <Text className="text-gray-700 italic text-center">
          "La santé n'est pas quelque chose que vous devez attendre pour demain. 
          Chaque repas est une nouvelle opportunité de nourrir votre corps."
        </Text>
        <Text className="text-gray-600 text-sm text-center mt-2">
          — Équipe NutriCoach
        </Text>
      </Section>

      {/* Quick links */}
      <Section className="bg-gray-50 rounded-lg p-6 mb-8">
        <Heading className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Liens rapides
        </Heading>
        
        <Row>
          <Column className="w-1/4 text-center">
            <Link href={`${baseUrl}/dashboard`} className="text-green-600 text-sm">
              📊 Dashboard
            </Link>
          </Column>
          <Column className="w-1/4 text-center">
            <Link href={`${baseUrl}/menu/generate`} className="text-green-600 text-sm">
              🍽️ Nouveau menu
            </Link>
          </Column>
          <Column className="w-1/4 text-center">
            <Link href={`${baseUrl}/recipes`} className="text-green-600 text-sm">
              📖 Recettes
            </Link>
          </Column>
          <Column className="w-1/4 text-center">
            <Link href={`${baseUrl}/profile`} className="text-green-600 text-sm">
              👤 Profil
            </Link>
          </Column>
        </Row>
      </Section>

      {/* Support */}
      <Section className="text-center mb-6">
        <Text className="text-gray-700 mb-4">
          Besoin d'aide ou de motivation ?
        </Text>
        <Row>
          <Column className="w-1/2 text-center">
            <Link
              href="mailto:support@nutricoach.app"
              className="text-green-600 font-medium"
            >
              💬 Parler à notre équipe
            </Link>
          </Column>
          <Column className="w-1/2 text-center">
            <Link
              href={`${baseUrl}/community`}
              className="text-green-600 font-medium"
            >
              👥 Rejoindre la communauté
            </Link>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
};

export default ReminderEmail;