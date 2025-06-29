import {
  Html,
  Head,
  Font,
  Preview,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Column,
  Row,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  user?: {
    fullName?: string;
    email: string;
  };
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nutricoach.app';

export const EmailLayout = ({
  preview,
  children,
  user,
  unsubscribeUrl,
  webviewUrl,
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          {/* Header with logo and web view link */}
          <Container className="border border-solid border-gray-200 rounded-lg my-10 mx-auto p-6 w-full max-w-2xl bg-white">
            <Section className="mb-8">
              <Row>
                <Column className="w-1/2">
                  <Img
                    src={`${baseUrl}/images/nutricoach-logo.png`}
                    width="160"
                    height="40"
                    alt="NutriCoach"
                    className="my-0"
                  />
                </Column>
                <Column className="w-1/2 text-right">
                  {webviewUrl && (
                    <Link
                      href={webviewUrl}
                      className="text-sm text-gray-600 underline"
                    >
                      Voir dans le navigateur
                    </Link>
                  )}
                </Column>
              </Row>
            </Section>

            {/* Main content */}
            <Section className="mb-8">
              {children}
            </Section>

            {/* Social media and links */}
            <Section className="mb-6">
              <Row>
                <Column className="text-center">
                  <Text className="text-gray-600 text-sm mb-4">
                    Suivez-nous pour plus de conseils nutrition
                  </Text>
                  <Row className="w-full">
                    <Column className="w-1/4 text-center">
                      <Link href="https://facebook.com/nutricoach" className="text-blue-600">
                        <Img
                          src={`${baseUrl}/images/social/facebook.png`}
                          width="24"
                          height="24"
                          alt="Facebook"
                          className="mx-auto"
                        />
                      </Link>
                    </Column>
                    <Column className="w-1/4 text-center">
                      <Link href="https://twitter.com/nutricoach" className="text-blue-400">
                        <Img
                          src={`${baseUrl}/images/social/twitter.png`}
                          width="24"
                          height="24"
                          alt="Twitter"
                          className="mx-auto"
                        />
                      </Link>
                    </Column>
                    <Column className="w-1/4 text-center">
                      <Link href="https://instagram.com/nutricoach" className="text-pink-600">
                        <Img
                          src={`${baseUrl}/images/social/instagram.png`}
                          width="24"
                          height="24"
                          alt="Instagram"
                          className="mx-auto"
                        />
                      </Link>
                    </Column>
                    <Column className="w-1/4 text-center">
                      <Link href="https://linkedin.com/company/nutricoach" className="text-blue-700">
                        <Img
                          src={`${baseUrl}/images/social/linkedin.png`}
                          width="24"
                          height="24"
                          alt="LinkedIn"
                          className="mx-auto"
                        />
                      </Link>
                    </Column>
                  </Row>
                </Column>
              </Row>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-gray-600 text-sm mb-2">
                NutriCoach - Votre coach nutrition intelligent
              </Text>
              <Text className="text-gray-600 text-sm mb-4">
                Révolutionnez votre alimentation avec des recommandations personnalisées basées sur l'IA
              </Text>
              
              <Row className="mb-4">
                <Column className="text-center">
                  <Link
                    href={`${baseUrl}/dashboard`}
                    className="text-green-600 text-sm font-medium mr-4"
                  >
                    Mon Dashboard
                  </Link>
                  <Link
                    href={`${baseUrl}/menu/generate`}
                    className="text-green-600 text-sm font-medium mr-4"
                  >
                    Générer un Menu
                  </Link>
                  <Link
                    href={`${baseUrl}/profile`}
                    className="text-green-600 text-sm font-medium"
                  >
                    Mon Profil
                  </Link>
                </Column>
              </Row>

              <Text className="text-gray-500 text-xs mb-2">
                Vous recevez cet email car vous êtes inscrit à NutriCoach.
              </Text>
              
              <Row>
                <Column className="text-center">
                  <Link
                    href={`${baseUrl}/profile`}
                    className="text-gray-500 text-xs underline mr-4"
                  >
                    Gérer mes préférences
                  </Link>
                  {unsubscribeUrl && (
                    <Link
                      href={unsubscribeUrl}
                      className="text-gray-500 text-xs underline"
                    >
                      Se désabonner
                    </Link>
                  )}
                </Column>
              </Row>
              
              <Text className="text-gray-500 text-xs mt-4">
                NutriCoach SAS, 123 Rue de la Nutrition, 75001 Paris, France
              </Text>
              
              <Text className="text-gray-500 text-xs">
                © 2024 NutriCoach. Tous droits réservés.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailLayout;