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

interface WelcomeEmailProps {
  user: {
    fullName?: string;
    email: string;
  };
  confirmEmailUrl?: string;
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';

export const WelcomeEmail = ({
  user,
  confirmEmailUrl,
  unsubscribeUrl,
  webviewUrl,
}: WelcomeEmailProps) => {
  const firstName = user.fullName?.split(' ')[0] || 'là';

  return (
    <EmailLayout
      preview={`Bienvenue chez NutriCoach ${firstName} ! Commencez votre transformation nutritionnelle dès aujourd'hui.`}
      user={user}
      unsubscribeUrl={unsubscribeUrl}
      webviewUrl={webviewUrl}
    >
      {/* Hero Section */}
      <Section className="text-center mb-8">
        <Img
          src={`${baseUrl}/images/email/welcome-hero.png`}
          width="500"
          height="200"
          alt="Bienvenue chez NutriCoach"
          className="mx-auto rounded-lg"
        />
      </Section>

      {/* Welcome Message */}
      <Section className="mb-8">
        <Heading className="text-3xl font-bold text-gray-900 text-center mb-4">
          Bienvenue chez NutriCoach, {firstName} ! 🌱
        </Heading>
        
        <Text className="text-lg text-gray-700 text-center mb-6">
          Félicitations ! Vous venez de faire le premier pas vers une alimentation plus saine 
          et personnalisée. Notre IA va vous accompagner dans votre transformation nutritionnelle.
        </Text>

        {confirmEmailUrl && (
          <Section className="text-center mb-8">
            <Button
              className="bg-green-600 rounded-lg text-white font-semibold py-3 px-8 text-lg"
              href={confirmEmailUrl}
            >
              Confirmer mon email
            </Button>
            <Text className="text-sm text-gray-600 mt-3">
              Confirmez votre email pour débloquer toutes les fonctionnalités
            </Text>
          </Section>
        )}
      </Section>

      {/* What's Next */}
      <Section className="mb-8">
        <Heading className="text-2xl font-semibold text-gray-900 mb-6">
          Voici ce qui vous attend :
        </Heading>

        <Row className="mb-6">
          <Column className="w-16">
            <Img
              src={`${baseUrl}/images/email/icons/ai-analysis.png`}
              width="48"
              height="48"
              alt="Analyse IA"
              className="rounded-lg"
            />
          </Column>
          <Column>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Analyse nutritionnelle personnalisée
            </Text>
            <Text className="text-gray-700">
              Notre IA analyse vos préférences, objectifs et contraintes pour créer 
              votre profil nutritionnel unique.
            </Text>
          </Column>
        </Row>

        <Row className="mb-6">
          <Column className="w-16">
            <Img
              src={`${baseUrl}/images/email/icons/menu-generation.png`}
              width="48"
              height="48"
              alt="Génération de menus"
              className="rounded-lg"
            />
          </Column>
          <Column>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Menus adaptatifs quotidiens
            </Text>
            <Text className="text-gray-700">
              Des menus qui s'adaptent à vos goûts, votre budget et vos objectifs santé, 
              générés chaque jour par notre IA.
            </Text>
          </Column>
        </Row>

        <Row className="mb-6">
          <Column className="w-16">
            <Img
              src={`${baseUrl}/images/email/icons/anti-inflammatory.png`}
              width="48"
              height="48"
              alt="Anti-inflammatoire"
              className="rounded-lg"
            />
          </Column>
          <Column>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Focus anti-inflammatoire
            </Text>
            <Text className="text-gray-700">
              Nos recommandations privilégient les aliments anti-inflammatoires 
              pour optimiser votre santé et votre bien-être.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Quick Actions */}
      <Section className="bg-green-50 rounded-lg p-6 mb-8">
        <Heading className="text-xl font-semibold text-gray-900 text-center mb-4">
          Commencez dès maintenant
        </Heading>
        
        <Row>
          <Column className="w-1/2 text-center pr-3">
            <Button
              className="bg-green-600 rounded-lg text-white font-medium py-2 px-4 w-full"
              href={`${baseUrl}/profile`}
            >
              Compléter mon profil
            </Button>
          </Column>
          <Column className="w-1/2 text-center pl-3">
            <Button
              className="bg-white border border-green-600 rounded-lg text-green-600 font-medium py-2 px-4 w-full"
              href={`${baseUrl}/menu/generate`}
            >
              Générer mon 1er menu
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Pro Tips */}
      <Section className="mb-8">
        <Heading className="text-xl font-semibold text-gray-900 mb-4">
          💡 Conseils pour bien commencer
        </Heading>
        
        <Row className="mb-4">
          <Column className="w-8">
            <Text className="text-green-600 font-bold text-lg">1.</Text>
          </Column>
          <Column>
            <Text className="text-gray-700">
              <strong>Complétez votre profil</strong> : Plus vous nous donnez d'informations, 
              plus nos recommandations seront précises.
            </Text>
          </Column>
        </Row>
        
        <Row className="mb-4">
          <Column className="w-8">
            <Text className="text-green-600 font-bold text-lg">2.</Text>
          </Column>
          <Column>
            <Text className="text-gray-700">
              <strong>Testez la génération de menu</strong> : Découvrez comment notre IA 
              crée des menus adaptés à vos besoins.
            </Text>
          </Column>
        </Row>
        
        <Row className="mb-4">
          <Column className="w-8">
            <Text className="text-green-600 font-bold text-lg">3.</Text>
          </Column>
          <Column>
            <Text className="text-gray-700">
              <strong>Explorez les recettes</strong> : Chaque recette est analysée pour 
              ses propriétés anti-inflammatoires.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Special Offer (if applicable) */}
      <Section className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mb-8 text-center">
        <Heading className="text-xl font-semibold text-gray-900 mb-2">
          🎁 Offre de bienvenue
        </Heading>
        <Text className="text-gray-700 mb-4">
          Profitez de 30% de réduction sur votre premier mois d'abonnement premium
        </Text>
        <Button
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-semibold py-3 px-6"
          href={`${baseUrl}/pricing?code=WELCOME30`}
        >
          Profiter de l'offre
        </Button>
        <Text className="text-sm text-gray-600 mt-2">
          Code promo : WELCOME30 • Valable jusqu'au 31 décembre
        </Text>
      </Section>

      {/* Support */}
      <Section className="text-center mb-6">
        <Text className="text-gray-700 mb-4">
          Une question ? Notre équipe est là pour vous aider !
        </Text>
        <Row>
          <Column className="w-1/2 text-center">
            <Link
              href="mailto:support@nutricoach.app"
              className="text-green-600 font-medium"
            >
              📧 support@nutricoach.app
            </Link>
          </Column>
          <Column className="w-1/2 text-center">
            <Link
              href={`${baseUrl}/help`}
              className="text-green-600 font-medium"
            >
              💬 Centre d'aide
            </Link>
          </Column>
        </Row>
      </Section>

      {/* Personal Message */}
      <Section className="border-l-4 border-green-500 pl-4 mb-6">
        <Text className="text-gray-700 italic">
          "Bienvenue dans votre parcours vers une meilleure santé ! 
          J'ai créé NutriCoach pour vous donner les outils dont vous avez besoin 
          pour transformer votre alimentation de manière durable et personnalisée."
        </Text>
        <Text className="text-gray-600 text-sm mt-2">
          — Marie Dupont, Fondatrice & Nutritionniste
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default WelcomeEmail;