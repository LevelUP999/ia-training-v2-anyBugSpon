import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Brain, Zap, Activity } from "lucide-react";

interface Token {
  perguntas: string[];
  resposta: string;
}

const Index = () => {
  const { toast } = useToast();
  const [initialJson, setInitialJson] = useState("");
  const [currentTokens, setCurrentTokens] = useState<Token[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [iterations, setIterations] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [PermissionOn, seterPermissionOn] = useState(false)

  const defaultJsonExample = `
    [
        {
            "perguntas": ["o", "que", "e", "uma", "célula", "eucarionte"],
            "resposta": "uma célula eucarionte é um tipo de célula que possui um núcleo delimitado por uma membrana nuclear.\nEsse núcleo contém o material genético da célula, ou seja, o dna.\nAlém do núcleo, as células eucariontes possuem outros organelos, como:\n       1- Mitocôndrias,\n  2- Ribossomos,\n     3- Retículo endoplasmático,\n que realizam funções vitais para a célula.\nElas são encontradas em organismos mais complexos, como:\n      1- Plantas,\n   2- Animais\n  3- Fungos."
        }
    ]
  `;

  useEffect(() => {
    setInitialJson(defaultJsonExample);
  }, []);

  useEffect(() => {
    if (!isPaused && PermissionOn) {
      // Chama a próxima iteração após um breve intervalo (500ms)
      timeoutRef.current = setTimeout(() => {
        performTrainingIteration();
      }, 3000);
      console.log(currentTokens);
    }
  }, [currentTokens])

  const validateJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return false;

      return parsed.every(token =>
        token.perguntas &&
        Array.isArray(token.perguntas) &&
        typeof token.resposta === 'string'
      );
    } catch {
      return false;
    }
  };

  const generateInstruction = (currentJson: Token[]) => {
    return `Gere 10 novos tokens com base no JSON a seguir. Siga estas regras:
1. Não repita perguntas que já existem no JSON.
2. As respostas devem ser bem completas e informativas.
3. Cada token deve seguir este formato:
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   },
   {
     "perguntas": [palavras sem pontuação e sem letras maiúsculas, e intercaladas como o modelo: '["modelo", "de", "pergunta"]'],
     "resposta": "resposta detalhada, sempre estruturada com \\n para estruturas"
   }
4. A resposta deve conter apenas o JSON, sem texto adicional, cabeçalhos ou formatações.

Estes são os Tokens atuais:
${JSON.stringify(currentJson, null, 2)}`;
  };

  const fetchNewTokens = async (tokens: Token[]): Promise<Token[]> => {
    const instruction = generateInstruction(tokens);

    try {
      console.log(instruction)
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer -AasPXGFr4qbtPYW'
        },
        body: JSON.stringify({
          model: "openai",
          messages: [
            {
              role: 'system',
              content: 'Você é um experiente treinador de Tokens de IA, você deve seguir a risca a os pedidos de geração de token.'
            },
            {
              role: 'user',
              content: instruction
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        setTimeout(() => {
          performTrainingIteration();
        }, 3000)
      }

      const responseText = await response.text();
      console.log(responseText);


      // Extrai o primeiro array JSON do texto da resposta
      function extractJSONArray(text: string): string {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');

        if (start === -1 || end === -1 || end <= start) {
          throw new Error('JSON array não encontrado na resposta.');
        }

        return text.slice(start, end + 1);
      }

      const cleanedJsonText = extractJSONArray(responseText);
      const newTokens = JSON.parse(cleanedJsonText);


      if (!Array.isArray(newTokens)) {
        throw new Error('Resposta não é um array de tokens');
      }

      return newTokens;
    } catch (error) {
      console.error('Erro ao buscar novos tokens:', error);
      throw error;
    }
  };

  const performTrainingIteration = async () => {
    if (isPaused) {
      console.log("Treinamento pausado, aguardando retomar...");
      return; // Não faça nada se estiver pausado
    }

    console.log("fetchando...");
    setIsProcessing(true);

    try {
      // Na primeira iteração, `currentTokens` será o valor inicial, após isso, será sempre a soma dos tokens antigos com os novos
      const newTokens = await fetchNewTokens(currentTokens); // Obtém novos tokens
      const updatedTokens = [...currentTokens, ...newTokens];
      console.log('newtokens: ', updatedTokens);
      // Atualiza a lista de tokens com os novos

      // Verifica se novos tokens foram adicionados
      if (updatedTokens.length > currentTokens.length) {
        console.log("Novos tokens encontrados:", newTokens);
      } else {
        console.log("Nenhum novo token foi adicionado.");
      }

      console.log('updatedTokens: ', updatedTokens);

      setCurrentTokens(updatedTokens);

      // Atualiza o estado de currentTokens
      setIterations(prev => prev + 1); // Incrementa o contador de iterações

      toast({
        title: "Iteração concluída",
        description: `${newTokens.length} novos tokens adicionados`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro no treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsTraining(false); // Finaliza o treinamento em caso de erro
    } finally {
      setIsProcessing(false); // Finaliza o processamento
    }
  };




  const startTraining = () => {
    if (!validateJson(initialJson)) {
      toast({
        title: "JSON inválido",
        description: "Por favor, insira um JSON válido com tokens",
        variant: "destructive",
      });
      return;
    }

    if (currentTokens.length === 0) {
      const tokens = JSON.parse(initialJson);
      setIsPaused(false); // Garantir que o treinamento não esteja pausado
      setIsTraining(true);  // Iniciar treinamento

      toast({
        title: "Treinamento iniciado",
        description: "O sistema começará a gerar novos tokens",
      });

      seterPermissionOn(true)
      setCurrentTokens(tokens);
    }
  };



  const pauseTraining = () => {
    setIsPaused(true);  // Pausar treinamento
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);  // Cancelar iteração pendente
    }

    toast({
      title: "Treinamento pausado",
      description: "O sistema pausou a geração de tokens",
    });
  };



  const resumeTraining = () => {
    setIsPaused(false);  // Retomar treinamento

    toast({
      title: "Treinamento retomado",
      description: "O sistema continuará gerando tokens",
    });

    if (isTraining) {
      timeoutRef.current = setTimeout(() => {
        performTrainingIteration();
      }, 500);
    }
  };



  const resetTraining = () => {
    setIsTraining(false);
    setIsPaused(false);
    setIterations(0);
    setCurrentTokens([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    toast({
      title: "Treinamento resetado",
      description: "Todos os dados foram limpos",
    });
  };

  const getStatus = () => {
    if (!isTraining) return "Parado";
    if (isPaused) return "Pausado";
    if (isProcessing) return "Processando...";
    return "Aguardando próxima iteração";
  };

  const getStatusColor = () => {
    if (!isTraining) return "secondary";
    if (isPaused) return "outline";
    if (isProcessing) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              System training IA
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Trainning IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="border border-border/50 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Configuração Inicial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  JSON com tokens iniciais:
                </label>
                <Textarea
                  value={initialJson}
                  onChange={(e) => setInitialJson(e.target.value)}
                  placeholder="Cole aqui o JSON com tokens iniciais..."
                  className="min-h-[200px] font-mono text-sm resize-none"
                  disabled={isTraining}
                />
              </div>

              <div className="flex gap-3">
                {!isTraining ? (
                  <Button
                    onClick={startTraining}
                    className="flex-1"
                    variant="glow"
                    size="lg"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Treinamento
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button
                        onClick={pauseTraining}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        <Pause className="w-4 h-4" />
                        Pausar
                      </Button>
                    ) : (
                      <Button
                        onClick={resumeTraining}
                        variant="secondary"
                        className="flex-1"
                        size="lg"
                      >
                        <Play className="w-4 h-4" />
                        Retomar
                      </Button>
                    )}
                  </>
                )}
                <Button
                  onClick={resetTraining}
                  variant="destructive"
                  size="lg"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card className="border border-border/50 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Status do Treinamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-primary">
                    {iterations}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Iterações
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-primary">
                    {currentTokens.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tokens Total
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Badge
                  variant={getStatusColor() as any}
                  className="text-lg px-4 py-2"
                >
                  {getStatus()}
                </Badge>
              </div>

              {isProcessing && (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gerando novos tokens...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {currentTokens.length > 0 && (
          <Card className="border border-border/50 shadow-card backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle>JSON Atual Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted/30 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono border border-border/30">
                  {JSON.stringify(currentTokens, null, 2)}
                </pre>
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(currentTokens, null, 2));
                      toast({
                        title: "Copiado!",
                        description: "JSON copiado para área de transferência",
                      });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;