package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	env1 "github.com/codingconcepts/env"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
	"github.com/sirupsen/logrus"
)

// EnvConfig
type EnvConfig struct {
	Tag           string `env:"TAG" required:"true"`
	Port          string `env:"PORT" required:"true"`
	Port0         string `env:"PORT0"`
	APIProxy      string `env:"API_PROXY" required:"true"`
	APIPathPrefix string `env:"API_PATH_PREFIX" required:"true"`
	StaticDir     string `env:"STATIC_DIR" required:"true"`
	LogPath       string `env:"LOG_PATH" required:"true"`
}

var (

	// envConfig
	envConfig *EnvConfig

	// logger
	logger *logrus.Logger
)

func init() {
	envConfig = &EnvConfig{}
	if err := env1.Set(envConfig); err != nil {
		panic(fmt.Errorf("parse env file error: %s", err.Error()))
	}
	if len(envConfig.Port0) > 0 {
		envConfig.Port = envConfig.Port0
	}
	logger = logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	logPath := fmt.Sprintf("%s/%s.api.log", envConfig.LogPath, "%Y-%m-%d_%H")
	writer, err := rotatelogs.New(logPath,
		rotatelogs.WithMaxAge(30*24*time.Hour),
		rotatelogs.WithRotationTime(time.Hour),
	)
	if err != nil {
		panic(fmt.Sprintf("new rotatelogs error: %s", err.Error()))
	}
	logger.SetOutput(writer)
}

func main() {
	router := gin.Default()
	router.Use(addTag)
	router.Any(fmt.Sprintf("%s/*urlpath", envConfig.APIPathPrefix), apiProxy)
	router.NoRoute(createStaticHandler(http.Dir(envConfig.StaticDir)))

	router.Run(":" + envConfig.Port)
}

func addTag(ctx *gin.Context) {
	if strings.HasSuffix(ctx.Request.URL.Path, ".html") || ctx.Request.URL.Path == "/" {
		ctx.SetCookie("tag", envConfig.Tag, 3600*24*365, "/", ctx.Request.Host, false, false)
	}
}

func apiProxy(ctx *gin.Context) {

	client := &http.Client{
		Timeout: time.Second * 5,
	}
	fullURL := getFullPath(ctx, envConfig.APIProxy)
	requestBody := getRequestBody(ctx)

	request, err := http.NewRequest(ctx.Request.Method, fullURL, requestBody)
	logAPI(ctx, map[string]interface{}{
		"proxy_url": fullURL,
		"method":    ctx.Request.Method,
	})

	for key, value := range ctx.Request.Header {
		request.Header.Add(key, strings.Join(value, ""))
	}
	if err != nil {
		ctx.AbortWithError(200, fmt.Errorf("new request with error: %v", err.Error()))
		return
	}
	response, err := client.Do(request)
	if err != nil {
		ctx.AbortWithError(200, fmt.Errorf("response error: %v", err.Error()))
		return
	}

	bytes, err := ioutil.ReadAll(response.Body)
	logAPI(ctx, map[string]interface{}{
		"proxy_url":     fullURL,
		"method":        ctx.Request.Method,
		"response_body": string(bytes),
		"header":        response.Header,
	})
	if err != nil {
		ctx.AbortWithError(200, fmt.Errorf("read respone error: %v", err.Error()))
		return
	}
	for key, values := range response.Header {
		if strings.ToLower(key) != "content-length" {
			ctx.Header(key, strings.Join(values, ""))
		}

	}

	var jsonData interface{}

	if err := json.Unmarshal(bytes, &jsonData); err == nil {
		ctx.JSON(http.StatusOK, jsonData)
	} else {
		ctx.String(http.StatusOK, string(bytes))
	}
}

func getFullPath(ctx *gin.Context, proxy string) string {
	fullPath := proxy + ctx.Param("urlpath")
	if len(ctx.Request.URL.RawQuery) > 0 {
		fullPath = fullPath + "?" + ctx.Request.URL.RawQuery
	}
	return fullPath
}

// getRequestBody
//
//	@param ctx
//	@return io.Reader
func getRequestBody(ctx *gin.Context) io.Reader {
	if ctx.Request.Method == http.MethodGet {
		return nil
	}

	bytes, err := ctx.GetRawData()
	if err == nil {
		logAPI(ctx, map[string]interface{}{
			"post_body": string(bytes),
		})
		return strings.NewReader(string(bytes))
	}
	return nil
}

func logAPI(ctx *gin.Context, extra map[string]interface{}) {
	data := map[string]interface{}{
		"url":   ctx.Request.URL.String(),
		"extra": extra,
	}
	headers := make(map[string]string)
	for k, v := range ctx.Request.Header {
		headers[k] = strings.Join(v, ",")
	}
	data["header"] = headers

	if raw, err := ctx.GetRawData(); err == nil {
		ctx.Request.Body = ioutil.NopCloser(bytes.NewBuffer(raw))
		data["body"] = string(raw)
	}

	logger.WithFields(logrus.Fields(data)).Info("api")

}

func createStaticHandler(fs http.FileSystem) gin.HandlerFunc {
	fileServer := http.StripPrefix("", http.FileServer(fs))
	return func(ctx *gin.Context) {
		file := strings.TrimLeft(ctx.Request.URL.Path, "/")
		// Check if file exists and/or if we have permission to access it
		f, err := fs.Open(file)
		if err != nil {
			ctx.Writer.WriteHeader(http.StatusNotFound)
			ctx.Abort()
			return
		}
		f.Close()

		fileServer.ServeHTTP(ctx.Writer, ctx.Request)
	}
}
