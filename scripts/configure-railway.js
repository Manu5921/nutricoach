#!/usr/bin/env node

const RAILWAY_TOKEN = '1888e485-2aa7-4440-8c56-081e3def90ed'

// Variables d'environnement Supabase requises
const SUPABASE_VARS = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://sgombrccebqutpompbjj.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Mzk5NTUsImV4cCI6MjA2NjQxNTk1NX0.jsOfUsgNVWiRIdm8GJGoGAPYzZNRne3LladfTvdQnkA',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgzOTk1NSwiZXhwIjoyMDY2NDE1OTU1fQ.C96QktQzrTbZ4lm1gQPT6sJ9doSaIpXrHakxiyw2MXU',
  'NODE_ENV': 'production',
  'NEXT_PUBLIC_BASE_URL': 'https://nutricoach-production.up.railway.app'
}

async function makeGraphQLRequest(query, variables = {}) {
  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  const result = await response.json()
  
  if (result.errors) {
    console.error('GraphQL Errors:', result.errors)
    throw new Error(`GraphQL Error: ${result.errors[0].message}`)
  }

  return result.data
}

async function findProject() {
  console.log('🔍 Recherche du projet NutriCoach...')
  
  const query = `
    query {
      me {
        projects {
          edges {
            node {
              id
              name
              environments {
                edges {
                  node {
                    id
                    name
                    deployments(first: 1) {
                      edges {
                        node {
                          url
                          status
                        }
                      }
                    }
                    serviceInstances {
                      edges {
                        node {
                          id
                          serviceName
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)
    const projects = data.me.projects.edges

    // Chercher le projet nutricoach
    for (const project of projects) {
      console.log(`📁 Projet trouvé: ${project.node.name}`)
      
      if (project.node.name.toLowerCase().includes('nutricoach')) {
        console.log(`✅ Projet NutriCoach trouvé: ${project.node.id}`)
        
        // Afficher les environnements
        for (const env of project.node.environments.edges) {
          console.log(`  📂 Environnement: ${env.node.name} (${env.node.id})`)
          
          if (env.node.deployments.edges.length > 0) {
            const deployment = env.node.deployments.edges[0].node
            console.log(`  🚀 URL: ${deployment.url}`)
            console.log(`  📊 Status: ${deployment.status}`)
          }
        }
        
        return project.node
      }
    }

    console.log('❌ Projet NutriCoach non trouvé')
    console.log('📋 Projets disponibles:')
    projects.forEach(p => console.log(`  - ${p.node.name}`))
    
    return null
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error.message)
    return null
  }
}

async function setEnvironmentVariable(projectId, environmentId, serviceId, name, value) {
  console.log(`🔧 Configuration: ${name}`)
  
  const mutation = `
    mutation VariableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input) {
        id
        name
        value
      }
    }
  `

  const variables = {
    input: {
      projectId,
      environmentId,
      serviceId,
      name,
      value
    }
  }

  try {
    const result = await makeGraphQLRequest(mutation, variables)
    console.log(`  ✅ ${name} configuré`)
    return result.variableUpsert
  } catch (error) {
    console.error(`  ❌ Erreur ${name}:`, error.message)
    return null
  }
}

async function configureAllVariables() {
  console.log('🚀 Configuration des variables d\'environnement Railway...\n')
  
  // Trouver le projet
  const project = await findProject()
  if (!project) {
    console.log('❌ Impossible de continuer sans projet')
    return
  }

  const projectId = project.id
  const environment = project.environments.edges[0]?.node
  
  if (!environment) {
    console.log('❌ Aucun environnement trouvé')
    return
  }

  const environmentId = environment.id
  const service = environment.serviceInstances.edges[0]?.node

  if (!service) {
    console.log('❌ Aucun service trouvé')
    return
  }

  const serviceId = service.id

  console.log(`\n📋 Configuration cible:`)
  console.log(`  Project ID: ${projectId}`)
  console.log(`  Environment: ${environment.name} (${environmentId})`)
  console.log(`  Service: ${service.serviceName} (${serviceId})`)
  console.log('')

  // Configurer toutes les variables
  let successCount = 0
  const totalVars = Object.keys(SUPABASE_VARS).length

  for (const [name, value] of Object.entries(SUPABASE_VARS)) {
    const result = await setEnvironmentVariable(projectId, environmentId, serviceId, name, value)
    if (result) {
      successCount++
    }
    
    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📊 Résultats: ${successCount}/${totalVars} variables configurées`)

  if (successCount === totalVars) {
    console.log('🎉 Configuration terminée avec succès !')
    console.log('⏱️ Le déploiement va redémarrer automatiquement...')
    console.log('🔍 Test dans 2-3 minutes: https://nutricoach-production.up.railway.app/api/health')
  } else {
    console.log('⚠️ Configuration partielle. Vérifiez les erreurs ci-dessus.')
  }
}

// Exécution
configureAllVariables().catch(error => {
  console.error('💥 Erreur critique:', error.message)
  process.exit(1)
})