import neo4j, { Driver, Session } from 'neo4j-driver';
import { PersonaData } from '../types';

export class Neo4jService {
  private static driver: Driver | null = null;

  static async initialize() {
    if (this.driver) return;

    const uri = process.env.EXPO_PUBLIC_NEO4J_URI || 'neo4j+s://your-neo4j-instance.databases.neo4j.io';
    const username = process.env.EXPO_PUBLIC_NEO4J_USERNAME || 'neo4j';
    const password = process.env.EXPO_PUBLIC_NEO4J_PASSWORD || 'your-password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    
    // Test connection
    try {
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4j successfully');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  static async close() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  private static async getSession(): Promise<Session> {
    if (!this.driver) {
      await this.initialize();
    }
    return this.driver!.session();
  }

  static async createUserNode(userId: string, persona: PersonaData): Promise<void> {
    const session = await this.getSession();
    
    try {
      const query = `
        MERGE (u:User {id: $userId})
        SET u.lastUpdated = datetime(),
            u.traits = $traits,
            u.insights = $insights
        RETURN u
      `;
      
      await session.run(query, {
        userId,
        traits: persona.traits,
        insights: persona.insights,
      });
    } finally {
      await session.close();
    }
  }

  static async updateUserPersona(userId: string, persona: PersonaData): Promise<void> {
    const session = await this.getSession();
    
    try {
      const query = `
        MATCH (u:User {id: $userId})
        SET u.traits = $traits,
            u.insights = $insights,
            u.lastUpdated = datetime()
        RETURN u
      `;
      
      await session.run(query, {
        userId,
        traits: persona.traits,
        insights: persona.insights,
      });
    } finally {
      await session.close();
    }
  }

  static async findCompatibleUsers(userId: string, limit: number = 10): Promise<Array<{ userId: string; compatibility: number }>> {
    const session = await this.getSession();
    
    try {
      // First, get the user's traits
      const userQuery = `
        MATCH (u:User {id: $userId})
        RETURN u.traits as traits
      `;
      
      const userResult = await session.run(userQuery, { userId });
      if (userResult.records.length === 0) {
        throw new Error('User not found in Neo4j');
      }
      
      const userTraits = userResult.records[0].get('traits');
      
      // Find compatible users using trait similarity
      const compatibilityQuery = `
        MATCH (u:User {id: $userId}), (other:User)
        WHERE other.id <> $userId AND other.traits IS NOT NULL
        
        WITH u, other,
        reduce(score = 0.0, trait IN keys(u.traits) |
          CASE 
            WHEN trait IN keys(other.traits) THEN 
              score + (1.0 - abs(u.traits[trait] - other.traits[trait])) * 
              CASE trait
                WHEN 'openness' THEN 0.8
                WHEN 'conscientiousness' THEN 0.6
                WHEN 'extraversion' THEN 0.4
                WHEN 'agreeableness' THEN 0.9
                WHEN 'neuroticism' THEN 0.3
                WHEN 'authenticity' THEN 0.9
                WHEN 'empathy' THEN 0.8
                WHEN 'curiosity' THEN 0.7
                WHEN 'resilience' THEN 0.6
                WHEN 'humor' THEN 0.7
                ELSE 0.5
              END
            ELSE score
          END
        ) as rawScore
        
        WITH other, rawScore / 6.8 as normalizedScore
        ORDER BY normalizedScore DESC
        LIMIT $limit
        
        RETURN other.id as userId, normalizedScore as compatibility
      `;
      
      const result = await session.run(compatibilityQuery, { userId, limit });
      
      return result.records.map(record => ({
        userId: record.get('userId'),
        compatibility: record.get('compatibility'),
      }));
    } finally {
      await session.close();
    }
  }

  static async createMatch(userId1: string, userId2: string, compatibility: number): Promise<string> {
    const session = await this.getSession();
    
    try {
      const query = `
        MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
        CREATE (u1)-[r:MATCHED {
          compatibility: $compatibility,
          createdAt: datetime(),
          status: 'pending'
        }]->(u2)
        RETURN elementId(r) as matchId
      `;
      
      const result = await session.run(query, { userId1, userId2, compatibility });
      return result.records[0].get('matchId');
    } finally {
      await session.close();
    }
  }

  static async getMatches(userId: string, status?: string): Promise<Array<{ matchId: string; otherUserId: string; compatibility: number; status: string; createdAt: string }>> {
    const session = await this.getSession();
    
    try {
      let query = `
        MATCH (u:User {id: $userId})-[r:MATCHED]-(other:User)
        WHERE u.id <> other.id
      `;
      
      if (status) {
        query += ` AND r.status = $status`;
      }
      
      query += `
        RETURN elementId(r) as matchId, other.id as otherUserId, 
               r.compatibility as compatibility, r.status as status,
               r.createdAt as createdAt
        ORDER BY r.createdAt DESC
      `;
      
      const result = await session.run(query, { userId, status });
      
      return result.records.map(record => ({
        matchId: record.get('matchId'),
        otherUserId: record.get('otherUserId'),
        compatibility: record.get('compatibility'),
        status: record.get('status'),
        createdAt: record.get('createdAt').toString(),
      }));
    } finally {
      await session.close();
    }
  }

  static async updateMatchStatus(matchId: string, status: string): Promise<void> {
    const session = await this.getSession();
    
    try {
      const query = `
        MATCH ()-[r:MATCHED]->()
        WHERE elementId(r) = $matchId
        SET r.status = $status
        RETURN r
      `;
      
      await session.run(query, { matchId, status });
    } finally {
      await session.close();
    }
  }

  static async getTraitDistribution(): Promise<Record<string, { min: number; max: number; avg: number }>> {
    const session = await this.getSession();
    
    try {
      const query = `
        MATCH (u:User)
        WHERE u.traits IS NOT NULL
        UNWIND keys(u.traits) AS trait
        RETURN trait,
               min(u.traits[trait]) as minValue,
               max(u.traits[trait]) as maxValue,
               avg(u.traits[trait]) as avgValue
      `;
      
      const result = await session.run(query);
      
      const distribution: Record<string, { min: number; max: number; avg: number }> = {};
      
      result.records.forEach(record => {
        const trait = record.get('trait');
        distribution[trait] = {
          min: record.get('minValue'),
          max: record.get('maxValue'),
          avg: record.get('avgValue'),
        };
      });
      
      return distribution;
    } finally {
      await session.close();
    }
  }

  static async getUserClusters(userId: string): Promise<Array<{ clusterId: string; users: string[] }>> {
    const session = await this.getSession();
    
    try {
      // Simple clustering based on trait similarity
      const query = `
        MATCH (u:User {id: $userId})
        CALL {
          WITH u
          MATCH (other:User)
          WHERE other.id <> u.id AND other.traits IS NOT NULL
          
          WITH other,
          reduce(similarity = 0.0, trait IN keys(u.traits) |
            CASE 
              WHEN trait IN keys(other.traits) THEN 
                similarity + (1.0 - abs(u.traits[trait] - other.traits[trait]))
              ELSE similarity
            END
          ) / size(keys(u.traits)) as similarity
          
          WHERE similarity > 0.7
          RETURN collect(other.id) as similarUsers
        }
        
        RETURN similarUsers
      `;
      
      const result = await session.run(query, { userId });
      
      if (result.records.length === 0) {
        return [];
      }
      
      const similarUsers = result.records[0].get('similarUsers');
      
      return [{
        clusterId: 'similar_traits',
        users: similarUsers,
      }];
    } finally {
      await session.close();
    }
  }
}