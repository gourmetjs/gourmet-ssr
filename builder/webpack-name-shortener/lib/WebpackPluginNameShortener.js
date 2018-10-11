    plugins.push({
      name: "chunk-name-shortner",
      plugin: class {
        apply(compiler) {
          compiler.hooks.compilation.tap(
            "ChunkNameShortner",
            compilation => {
              compilation.hooks.afterOptimizeChunks.tap(
                "ChunkNameShortner",
                chunks => {
                  for (const chunk of chunks) {
                    chunk.name = `$$-${chunk.name || chunk.id}`;
                  }
                }
              );
            }
          );
        }
      }
    });
