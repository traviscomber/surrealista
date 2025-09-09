import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get("test")

  try {
    switch (test) {
      case "oauth":
        return await testOAuthEndpoint(request)
      case "cookies":
        return await testCookies()
      case "api":
        return await testDriveAPI()
      case "folder":
        return await testFolderAccess()
      case "permissions":
        return await testPermissions()
      case "status":
        return await getConnectionStatus()
      default:
        return NextResponse.json({
          success: false,
          error: "Invalid test parameter",
        })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function testOAuthEndpoint(request: NextRequest) {
  try {
    const oauthUrl = new URL("/api/auth/google", request.url)
    const response = await fetch(oauthUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Diagnostics/1.0",
      },
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `OAuth endpoint accessible (${response.status})`,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `OAuth endpoint returned ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Failed to reach OAuth endpoint: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

async function testCookies() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")
    const refreshToken = cookieStore.get("google_refresh_token")

    const results = {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.value?.length || 0,
      refreshTokenLength: refreshToken?.value?.length || 0,
    }

    if (results.hasAccessToken) {
      return NextResponse.json({
        success: true,
        message: "Authentication cookies found",
        details: results,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "No authentication cookies found",
        details: results,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Cookie check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

async function testDriveAPI() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "No access token available for API test",
      })
    }

    const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Google Drive API accessible",
        details: {
          user: data.user?.displayName || "Unknown",
          email: data.user?.emailAddress || "Unknown",
        },
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: `Drive API returned ${response.status}`,
        details: errorData,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Drive API test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

async function testFolderAccess() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "No access token available for folder test",
      })
    }

    const folderId = "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F"
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=parents in "${folderId}" and mimeType="application/vnd.google-apps.folder"&fields=files(id,name,mimeType,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: `Folder accessible with ${data.files?.length || 0} subfolders`,
        details: {
          folderCount: data.files?.length || 0,
          folders: data.files?.slice(0, 5).map((f: any) => f.name) || [],
        },
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: `Folder access failed with ${response.status}`,
        details: errorData,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Folder access test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

async function testPermissions() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "No access token available for permissions test",
      })
    }

    // Test basic Drive permissions
    const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=user,storageQuota", {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Required permissions available",
        details: {
          canReadFiles: true,
          canAccessUserInfo: !!data.user,
          hasStorageInfo: !!data.storageQuota,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `Permissions check failed with ${response.status}`,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Permissions test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}

async function getConnectionStatus() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("google_access_token")
    const refreshToken = cookieStore.get("google_refresh_token")

    let folderCount = 0
    let canAccessDrive = false

    if (accessToken) {
      try {
        const folderId = "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F"
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=parents in "${folderId}" and mimeType="application/vnd.google-apps.folder"&fields=files(id,name)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken.value}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          folderCount = data.files?.length || 0
          canAccessDrive = true
        }
      } catch (error) {
        // Folder access failed, but we still have tokens
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        isAuthenticated: !!accessToken,
        hasValidToken: !!accessToken && accessToken.value.length > 0,
        canAccessDrive,
        folderCount,
        lastSync: canAccessDrive ? new Date().toISOString() : null,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Status check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}
