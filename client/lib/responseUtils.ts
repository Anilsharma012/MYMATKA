/**
 * Safely parse a response as JSON with proper error handling
 * Prevents "Response body is already used" errors
 */
export async function safeParseResponse(response: Response): Promise<any> {
  // Check if response body has already been consumed
  if (response.bodyUsed) {
    console.error("Response body already consumed");
    return {
      success: false,
      message: "Response body was already read",
      error: true,
    };
  }

  const contentType = response.headers.get("content-type");

  try {
    // Always try to read as text first to avoid body consumption issues
    const textResponse = await response.text();

    // Check if we got any content
    if (!textResponse) {
      console.error("Empty response received");
      return {
        success: false,
        message: "Empty response from server",
        error: true,
      };
    }

    // Check if it looks like JSON based on content type or content
    const isLikelyJSON =
      contentType?.includes("application/json") ||
      textResponse.trim().startsWith("{") ||
      textResponse.trim().startsWith("[");

    if (!isLikelyJSON) {
      console.error("Non-JSON response:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        response: textResponse.substring(0, 500),
      });

      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
        error: true,
      };
    }

    // Try to parse as JSON
    try {
      return JSON.parse(textResponse);
    } catch (jsonError) {
      console.error("❌ Failed to parse response JSON:", jsonError);
      console.error("Response text:", textResponse.substring(0, 500));

      return {
        success: false,
        message: "Invalid JSON response from server",
        error: true,
      };
    }
  } catch (readError) {
    console.error("❌ Failed to read response:", readError);

    return {
      success: false,
      message: "Failed to read response from server",
      error: true,
    };
  }
}

/**
 * Check if a parsed response indicates an error
 */
export function isResponseError(data: any): boolean {
  return data?.error === true || data?.success === false;
}
