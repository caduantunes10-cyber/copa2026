import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { friendId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is premium
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_premium) {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 })
    }

    // Check if users are friends
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', friendId)
      .single()

    if (friendshipError) {
      return NextResponse.json({ error: 'Not friends' }, { status: 403 })
    }

    // Get friend profile
    const { data: friendProfile, error: friendError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, is_premium')
      .eq('id', friendId)
      .single()

    if (friendError) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 })
    }

    // Get comparison data using the validated query
    const { data: comparisonData, error: comparisonError } = await supabase
      .rpc('get_friend_comparison', {
        current_user_id: user.id,
        friend_user_id: friendId
      })

    if (comparisonError) {
      console.error('Comparison RPC error details:', {
        message: comparisonError.message,
        details: comparisonError.details,
        hint: comparisonError.hint,
        code: comparisonError.code,
        userId: user.id,
        friendId: friendId
      })
      return NextResponse.json({ error: 'Failed to get comparison' }, { status: 500 })
    }

    // Process the comparison data
    const agreements = comparisonData?.filter(item => item.comparison_type === 'match') || []
    const differences = comparisonData?.filter(item => item.comparison_type === 'different') || []
    const totalCompared = agreements.length + differences.length

    // Calculate compatibility percentage
    const compatibilityScore = totalCompared > 0 
      ? Math.round((agreements.length / totalCompared) * 100)
      : 0

    // Handle edge cases
    if (totalCompared === 0) {
      return NextResponse.json({
        success: true,
        data: {
          compatibility_score: 0,
          friend_profile: friendProfile,
          summary: {
            total_compared: 0,
            agreements: 0,
            differences: 0,
            compatibility_percentage: 0,
            message: 'No common polls yet.'
          },
          agreements: [],
          differences: [],
          limitedData: false
        }
      })
    }

    const limitedData = totalCompared < 3

    return NextResponse.json({
      success: true,
      data: {
        compatibility_score: compatibilityScore,
        friend_profile: friendProfile,
        summary: {
          total_compared: totalCompared,
          agreements: agreements.length,
          differences: differences.length,
          compatibility_percentage: compatibilityScore,
          message: limitedData ? 'Comparison based on limited data.' : null
        },
        agreements: agreements.map(item => ({
          poll_id: item.poll_id,
          question: item.question,
          user_option: item.user_option,
          friend_option: item.friend_option,
          option_text: Array.isArray(item.options) ? item.options[item.user_option] : item.options?.[item.user_option]?.label || 'Opção não encontrada'
        })),
        differences: differences.map(item => ({
          poll_id: item.poll_id,
          question: item.question,
          user_option: item.user_option,
          friend_option: item.friend_option,
          user_option_text: Array.isArray(item.options) ? item.options[item.user_option] : item.options?.[item.user_option]?.label || 'Opção não encontrada',
          friend_option_text: Array.isArray(item.options) ? item.options[item.friend_option] : item.options?.[item.friend_option]?.label || 'Opção não encontrada'
        })),
        limitedData
      }
    })

  } catch (error) {
    console.error('Friend comparison error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
