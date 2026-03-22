import { gql } from '@apollo/client/core'

export const GET_TENANT_TRAINING = gql`
  query GetTenantTraining($tenantId: String!, $page: PageInput, $search: String) {
    tenantTrainingData(tenantId: $tenantId, page: $page, search: $search) {
      items {
        id
        description
        entries { key value }
        pricingFacts {
          id
          projectType
          material
          unit
          priceMin
          priceMax
          pricePoint
          includesLabor
          condition
          notes
          source
          confidence
          basedOnCount
          observedAt
        }
        tenantId
        projectId
        uploadedAt
        createdAt
        updatedAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const GET_PROJECT_TRAINING = gql`
  query GetProjectTraining($tenantId: String!, $projectId: String!, $page: PageInput, $search: String) {
    projectTrainingData(tenantId: $tenantId, projectId: $projectId, page: $page, search: $search) {
      items {
        id
        description
        entries { key value }
        pricingFacts {
          id
          projectType
          material
          unit
          priceMin
          priceMax
          pricePoint
          includesLabor
          condition
          notes
          source
          confidence
          basedOnCount
          observedAt
        }
        tenantId
        projectId
        uploadedAt
        createdAt
        updatedAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const CREATE_TENANT_TRAINING = gql`
  mutation CreateTenantTraining($input: CreateTenantTrainingDataInput!) {
    createTenantTrainingData(input: $input) {
      id
      description
      entries { key value }
      pricingFacts {
        id
        projectType
        unit
        priceMin
        priceMax
        pricePoint
        includesLabor
      }
      tenantId
      uploadedAt
      createdAt
    }
  }
`

export const CREATE_PROJECT_TRAINING = gql`
  mutation CreateProjectTraining($input: CreateProjectTrainingDataInput!) {
    createProjectTrainingData(input: $input) {
      id
      description
      entries { key value }
      pricingFacts {
        id
        projectType
        unit
        priceMin
        priceMax
        pricePoint
        includesLabor
      }
      tenantId
      projectId
      uploadedAt
      createdAt
    }
  }
`

export const UPDATE_TRAINING = gql`
  mutation UpdateTraining($id: ID!, $tenantId: String!, $input: UpdateTrainingDataInput!) {
    updateTrainingData(id: $id, tenantId: $tenantId, input: $input) {
      id
      description
      entries { key value }
      pricingFacts {
        id
        projectType
        unit
        priceMin
        priceMax
        pricePoint
        includesLabor
      }
      updatedAt
    }
  }
`

export const DELETE_TRAINING = gql`
  mutation DeleteTraining($id: ID!, $tenantId: String!) {
    deleteTrainingData(id: $id, tenantId: $tenantId)
  }
`
